import { writeFileSync, readFileSync, existsSync, unlinkSync, mkdirSync, renameSync } from "node:fs"
import { join, extname, relative, resolve } from "node:path"
import { createHash, randomUUID } from "node:crypto"
import { validateImage } from "./imageValidator.js"
import type { CoverResolutionRepository } from "../infrastructure/persistence/sqlite/coverResolutionRepository.js"

export type CoverSource = "upload" | "url" | "remote" | "alternative" | "folder" | "embedded"
export type CoverFailureCode = "local-artwork-not-found" | "remote-not-found" | "remote-temporarily-unavailable" | "invalid-image"

export interface CoverMeta {
    contentType?: string
    uploadedAt?: string
    source?: CoverSource
    resolutionStatus?: CoverResolutionStatus
    lastResolutionAt?: string
    resolvedAt?: string
    candidateUrls?: string[]
    failureCode?: CoverFailureCode
    sizeBytes?: number
    width?: number
    height?: number
    sourceFingerprint?: string
}

export type CoverResolutionStatus = "cached" | "not-found" | "temporarily-unavailable" | "invalid-image"
export interface CoverResolutionResult { status: CoverResolutionStatus }

const MAX_COVER_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB
const COVER_HOSTS = new Set(["coverartarchive.org", "archive.org"])
const MAX_COVER_CANDIDATES = 4

const VALID_IMAGE_TYPES = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
])

const ALBUM_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function assertValidAlbumId(albumId: string): void {
    if (!ALBUM_ID_PATTERN.test(albumId)) {
        throw new Error("Invalid album ID")
    }
}

function removeIfExists(path: string): void {
    try {
        if (existsSync(path)) unlinkSync(path)
    } catch {
        // Cleanup never invalidates an already committed replacement.
    }
}

function hasExpectedSignature(buffer: Buffer, contentType: string): boolean {
    switch (contentType) {
        case "image/jpeg":
            return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff
        case "image/png":
            return buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
        case "image/webp":
            return buffer.length >= 12
                && buffer.subarray(0, 4).toString("ascii") === "RIFF"
                && buffer.subarray(8, 12).toString("ascii") === "WEBP"
        case "image/gif": {
            const signature = buffer.subarray(0, 6).toString("ascii")
            return signature === "GIF87a" || signature === "GIF89a"
        }
        default:
            return false
    }
}

export function createCoverService(dataDir: string, resolutionRepository?: CoverResolutionRepository) {
    const coversDir = join(dataDir, "covers")
    mkdirSync(coversDir, { recursive: true })

    function safeCoverPath(filename: string): string {
        const base = resolve(coversDir)
        const target = resolve(base, filename)
        const pathFromBase = relative(base, target)
        if (pathFromBase.startsWith("..") || pathFromBase.includes("\0")) {
            throw new Error("Invalid cover path")
        }
        return target
    }

    function getCoverPath(albumId: string): string | null {
        assertValidAlbumId(albumId)
        for (const ext of [".jpg", ".jpeg", ".png", ".webp", ".gif"]) {
            const path = safeCoverPath(`${albumId}${ext}`)
            if (existsSync(path)) {
                return path
            }
        }
        return null
    }

    function getMetaPath(albumId: string): string {
        assertValidAlbumId(albumId)
        return safeCoverPath(`${albumId}.json`)
    }

    function getContentTypeFromExtension(filePath: string): string {
        const ext = extname(filePath).toLowerCase()
        switch (ext) {
            case ".jpg":
            case ".jpeg":
                return "image/jpeg"
            case ".png":
                return "image/png"
            case ".webp":
                return "image/webp"
            case ".gif":
                return "image/gif"
            default:
                return "application/octet-stream"
        }
    }

    function readMeta(albumId: string): CoverMeta | null {
        const metaPath = getMetaPath(albumId)
        let fileMeta: CoverMeta | null
        if (!existsSync(metaPath)) {
            fileMeta = null
        } else {
            try {
                fileMeta = JSON.parse(readFileSync(metaPath, "utf-8")) as CoverMeta
            } catch {
                fileMeta = null
            }
        }
        const persisted = resolutionRepository?.findByAlbumId(albumId)
        if (!persisted) return fileMeta
        return {
            ...fileMeta,
            source: persisted.source_type ?? fileMeta?.source,
            resolutionStatus: persisted.status,
            lastResolutionAt: persisted.last_attempt_at,
            resolvedAt: persisted.resolved_at ?? undefined,
            candidateUrls: persisted.candidate_urls,
            failureCode: persisted.failure_code ?? undefined,
            sizeBytes: persisted.size_bytes ?? undefined,
            contentType: persisted.mime_type ?? fileMeta?.contentType,
            width: persisted.width ?? undefined,
            height: persisted.height ?? undefined,
            sourceFingerprint: persisted.source_fingerprint ?? undefined,
        }
    }

    function writeMeta(albumId: string, meta: CoverMeta): void {
        writeFileSync(getMetaPath(albumId), JSON.stringify(meta))
    }

    function sanitizeCandidates(sourceUrls: string[]): string[] {
        const candidates: string[] = []
        for (const sourceUrl of sourceUrls) {
            let parsed: URL
            try { parsed = new URL(sourceUrl) } catch { continue }
            if (parsed.protocol !== "https:" || !COVER_HOSTS.has(parsed.hostname)) continue
            if (!candidates.includes(parsed.toString())) candidates.push(parsed.toString())
            if (candidates.length === MAX_COVER_CANDIDATES) break
        }
        return candidates
    }

    return {
        coversDir,

        saveCover(albumId: string, buffer: Buffer, contentType: string, source?: CoverSource,
            dimensions?: { width: number; height: number }): void {
            assertValidAlbumId(albumId)
            if (buffer.length > MAX_COVER_SIZE_BYTES) {
                throw new Error(`Cover exceeds maximum size of ${MAX_COVER_SIZE_BYTES} bytes`)
            }

            if (!VALID_IMAGE_TYPES.has(contentType)) {
                throw new Error(`Invalid content type: ${contentType}. Must be an image.`)
            }

            if (!hasExpectedSignature(buffer, contentType)) {
                throw new Error("Image content does not match its content type")
            }

            // Determine extension from content type
            let ext = ".jpg"
            switch (contentType) {
                case "image/jpeg":
                    ext = ".jpg"
                    break
                case "image/png":
                    ext = ".png"
                    break
                case "image/webp":
                    ext = ".webp"
                    break
                case "image/gif":
                    ext = ".gif"
                    break
            }

            const filePath = safeCoverPath(`${albumId}${ext}`)
            const temporarySuffix = `.tmp-${randomUUID()}`
            const temporaryCoverPath = safeCoverPath(`${albumId}${ext}${temporarySuffix}`)
            const temporaryMetaPath = safeCoverPath(`${albumId}.json${temporarySuffix}`)
            const backupCoverPath = safeCoverPath(`${albumId}.cover-backup${temporarySuffix}`)
            const backupMetaPath = safeCoverPath(`${albumId}.meta-backup${temporarySuffix}`)

            const previousMeta = readMeta(albumId)
            const previousCoverPath = getCoverPath(albumId)
            const previousMetaPath = getMetaPath(albumId)
            const now = new Date().toISOString()
            const fingerprint = createHash("sha256").update(buffer).digest("hex")
            const meta: CoverMeta = {
                contentType,
                uploadedAt: now,
                source,
                resolutionStatus: "cached",
                lastResolutionAt: now,
                resolvedAt: now,
                candidateUrls: previousMeta?.candidateUrls,
                failureCode: undefined,
                sizeBytes: buffer.length,
                width: dimensions?.width,
                height: dimensions?.height,
                sourceFingerprint: fingerprint,
            }
            let replacementInstalled = false
            try {
                writeFileSync(temporaryCoverPath, buffer, { flag: "wx" })
                writeFileSync(temporaryMetaPath, JSON.stringify(meta), { flag: "wx" })
                if (previousCoverPath) renameSync(previousCoverPath, backupCoverPath)
                if (existsSync(previousMetaPath)) renameSync(previousMetaPath, backupMetaPath)
                renameSync(temporaryCoverPath, filePath)
                replacementInstalled = true
                renameSync(temporaryMetaPath, getMetaPath(albumId))
                if (source) {
                    resolutionRepository?.recordSuccess({
                        albumId,
                        source: source === "url" ? "remote" : source,
                        attemptedAt: now,
                        resolvedAt: now,
                        fingerprint,
                        sizeBytes: buffer.length,
                        mimeType: contentType as "image/jpeg" | "image/png" | "image/webp" | "image/gif",
                        width: dimensions?.width,
                        height: dimensions?.height,
                        candidateUrls: previousMeta?.candidateUrls,
                    })
                }
                for (const oldExt of [".jpg", ".jpeg", ".png", ".webp", ".gif"]) {
                    if (oldExt === ext) continue
                    const oldPath = safeCoverPath(`${albumId}${oldExt}`)
                    removeIfExists(oldPath)
                }
                removeIfExists(backupCoverPath)
                removeIfExists(backupMetaPath)
            } catch (error) {
                if (replacementInstalled && existsSync(filePath)) unlinkSync(filePath)
                if (replacementInstalled && existsSync(getMetaPath(albumId))) unlinkSync(getMetaPath(albumId))
                if (previousCoverPath && existsSync(backupCoverPath)) renameSync(backupCoverPath, previousCoverPath)
                if (existsSync(backupMetaPath)) renameSync(backupMetaPath, previousMetaPath)
                throw error
            } finally {
                removeIfExists(temporaryCoverPath)
                removeIfExists(temporaryMetaPath)
                removeIfExists(backupCoverPath)
                removeIfExists(backupMetaPath)
            }
        },

        async saveValidatedCover(albumId: string, buffer: Buffer, contentType: string, source: CoverSource): Promise<void> {
            const validated = await validateImage(buffer, contentType)
            this.saveCover(albumId, validated.buffer, validated.contentType, source, validated)
        },

        recordResolutionDiagnostic(albumId: string, status: CoverResolutionStatus, failureCode?: CoverFailureCode): void {
            const previousMeta = readMeta(albumId)
            writeMeta(albumId, {
                ...previousMeta,
                resolutionStatus: status,
                lastResolutionAt: new Date().toISOString(),
                failureCode,
            })
            if (failureCode) {
                resolutionRepository?.recordFailure(albumId, status, new Date().toISOString(), failureCode,
                    previousMeta?.candidateUrls ?? [])
            }
        },

        async resolveRemoteCover(albumId: string, sourceUrls: string | string[]): Promise<CoverResolutionResult> {
            assertValidAlbumId(albumId)
            const previousMeta = readMeta(albumId)
            const requested = Array.isArray(sourceUrls) ? sourceUrls : [sourceUrls]
            const candidates = sanitizeCandidates([...requested, ...(previousMeta?.candidateUrls ?? [])])
            let finalStatus: CoverResolutionStatus = candidates.length > 0 ? "not-found" : "invalid-image"

            for (const candidate of candidates) {
                const parsed = new URL(candidate)
                for (let attempt = 0; attempt < 3; attempt++) {
                    try {
                        const response = await fetch(parsed, { redirect: "follow", signal: AbortSignal.timeout(12_000) })
                        if (response.status === 404) break
                        if (response.status === 429 || response.status >= 500) {
                            finalStatus = "temporarily-unavailable"
                            if (attempt < 2) { await new Promise(resolve => setTimeout(resolve, 150 * 2 ** attempt)); continue }
                            break
                        }
                        if (!response.ok) { finalStatus = "invalid-image"; break }
                        const finalUrl = response.url ? new URL(response.url) : parsed
                        if (!COVER_HOSTS.has(finalUrl.hostname)) { finalStatus = "invalid-image"; break }
                        const contentType = (response.headers.get("content-type") ?? "").split(";")[0]!
                        const declaredSize = Number(response.headers.get("content-length") ?? 0)
                        if (!VALID_IMAGE_TYPES.has(contentType) || declaredSize > MAX_COVER_SIZE_BYTES) { finalStatus = "invalid-image"; break }
                        const buffer = Buffer.from(await response.arrayBuffer())
                        if (buffer.length === 0 || buffer.length > MAX_COVER_SIZE_BYTES || !hasExpectedSignature(buffer, contentType)) { finalStatus = "invalid-image"; break }
                        writeMeta(albumId, { ...previousMeta, candidateUrls: candidates })
                        try {
                            await this.saveValidatedCover(albumId, buffer, contentType, "remote")
                        } catch {
                            finalStatus = "invalid-image"
                            break
                        }
                        return { status: "cached" }
                    } catch {
                        finalStatus = "temporarily-unavailable"
                        if (attempt < 2) { await new Promise(resolve => setTimeout(resolve, 150 * 2 ** attempt)); continue }
                        break
                    }
                }
            }
            writeMeta(albumId, {
                ...previousMeta,
                resolutionStatus: finalStatus,
                lastResolutionAt: new Date().toISOString(),
                candidateUrls: candidates,
                failureCode: finalStatus === "not-found"
                    ? "remote-not-found"
                    : finalStatus === "temporarily-unavailable"
                        ? "remote-temporarily-unavailable"
                        : "invalid-image",
            })
            resolutionRepository?.recordFailure(
                albumId,
                getCoverPath(albumId) ? "cached" : finalStatus,
                new Date().toISOString(),
                finalStatus === "not-found"
                    ? "remote-not-found"
                    : finalStatus === "temporarily-unavailable"
                        ? "remote-temporarily-unavailable"
                        : "invalid-image",
                candidates,
            )
            return { status: finalStatus }
        },

        getCoverPath(albumId: string): string | null {
            return getCoverPath(albumId)
        },

        deleteCover(albumId: string): boolean {
            assertValidAlbumId(albumId)
            let deleted = false
            for (const ext of [".jpg", ".jpeg", ".png", ".webp", ".gif"]) {
                const path = safeCoverPath(`${albumId}${ext}`)
                if (existsSync(path)) {
                    unlinkSync(path)
                    deleted = true
                }
            }
            const metaPath = getMetaPath(albumId)
            if (existsSync(metaPath)) {
                unlinkSync(metaPath)
                deleted = true
            }
            resolutionRepository?.delete(albumId)
            return deleted
        },

        getContentType(albumId: string): string | null {
            const metaPath = getMetaPath(albumId)
            if (existsSync(metaPath)) {
                try {
                    const meta = JSON.parse(readFileSync(metaPath, "utf-8")) as CoverMeta
                    return meta.contentType ?? null
                } catch {
                    // fall through
                }
            }
            const coverPath = getCoverPath(albumId)
            if (coverPath) {
                return getContentTypeFromExtension(coverPath)
            }
            return null
        },

        getMeta(albumId: string): CoverMeta | null {
            return readMeta(albumId)
        },
    }
}

export type CoverService = ReturnType<typeof createCoverService>
