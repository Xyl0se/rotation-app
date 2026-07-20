import { createReadStream, statSync, type ReadStream } from "node:fs"
import { createHash } from "node:crypto"
import type { PathGuard } from "../infrastructure/filesystem/pathGuard.js"
import type { PlaybackManifestRepository } from "../infrastructure/persistence/sqlite/playbackManifestRepository.js"
import type { BindingRepository } from "../infrastructure/persistence/sqlite/bindingRepository.js"

export type ContentType = "audio/mpeg" | "audio/mp4" | "audio/flac"

export interface MediaStreamResult {
    status: 200 | 206 | 416
    headers: Record<string, string>
    stream: ReadStream | null
    totalSize: number
}

export interface MediaError {
    status: 404 | 405
    body: { error: string }
}

const CONTENT_TYPE_MAP: Record<string, ContentType> = {
    ".mp3": "audio/mpeg",
    ".m4a": "audio/mp4",
    ".flac": "audio/flac",
}

export interface ParseRangeResult {
    start: number
    end: number
    total: number
    valid: boolean
    satisfiable: boolean
}

export function parseRangeHeader(rangeHeader: string, totalSize: number): ParseRangeResult {
    const prefix = "bytes="
    if (!rangeHeader.startsWith(prefix)) {
        return { start: 0, end: 0, total: totalSize, valid: false, satisfiable: false }
    }

    const ranges = rangeHeader.slice(prefix.length).split(",").map(s => s.trim())
    // Multi-range not supported
    if (ranges.length !== 1) {
        return { start: 0, end: 0, total: totalSize, valid: false, satisfiable: false }
    }

    const range = ranges[0]
    const parts = range.split("-")
    if (parts.length !== 2) {
        return { start: 0, end: 0, total: totalSize, valid: false, satisfiable: false }
    }

    const startStr = parts[0].trim()
    const endStr = parts[1].trim()

    // bytes=-500 (last 500 bytes) — not supported for simplicity
    if (startStr === "" && endStr !== "") {
        return { start: 0, end: 0, total: totalSize, valid: false, satisfiable: false }
    }

    // bytes=500- (from 500 to end) — not supported for simplicity
    if (startStr !== "" && endStr === "") {
        return { start: 0, end: 0, total: totalSize, valid: false, satisfiable: false }
    }

    const start = Number.parseInt(startStr, 10)
    const end = Number.parseInt(endStr, 10)

    if (
        !Number.isFinite(start) ||
        !Number.isFinite(end) ||
        Number.isNaN(start) ||
        Number.isNaN(end) ||
        start < 0 ||
        end < 0 ||
        start > end
    ) {
        return { start: 0, end: 0, total: totalSize, valid: false, satisfiable: false }
    }

    if (start >= totalSize) {
        return { start, end, total: totalSize, valid: true, satisfiable: false }
    }

    const clampedEnd = Math.min(end, totalSize - 1)

    return { start, end: clampedEnd, total: totalSize, valid: true, satisfiable: true }
}

export function createPlaybackMediaService(
    bindingRepo: BindingRepository,
    manifestRepo: PlaybackManifestRepository,
    musicGuard: PathGuard,
) {
    function resolveContentType(filename: string): ContentType | null {
        const ext = filename.slice(filename.lastIndexOf(".")).toLowerCase()
        return CONTENT_TYPE_MAP[ext] ?? null
    }

    function computeEtag(relativePath: string, size: number, mtimeMs: number): string {
        const hash = createHash("sha256")
            .update(`${relativePath}:${size}:${Math.floor(mtimeMs)}`)
            .digest("hex")
            .slice(0, 16)
        return `"${hash}"`
    }

    function streamMedia(
        albumId: string,
        opaqueTrackId: string,
        rangeHeader: string | undefined,
    ): MediaStreamResult | MediaError {
        // 1. Validate binding
        const binding = bindingRepo.findByLibraryAlbumId(albumId)
        if (!binding || binding.state !== "confirmed") {
            return { status: 404, body: { error: "Album or binding not found" } }
        }

        // 2. Resolve track from manifest cache
        const cached = manifestRepo.getManifest(albumId)
        if (!cached || cached.invalidatedAt !== null) {
            return { status: 404, body: { error: "Manifest not available" } }
        }

        const track = cached.manifest.tracks.find(t => t.opaqueTrackId === opaqueTrackId)
        if (!track) {
            return { status: 404, body: { error: "Track not found" } }
        }

        // 3. Resolve physical path
        const filePath = musicGuard(track._sourcePath)
        const stats = statSync(filePath)
        if (!stats.isFile()) {
            return { status: 404, body: { error: "Track not found" } }
        }

        const contentType = resolveContentType(track._sourcePath)
        if (!contentType) {
            return { status: 404, body: { error: "Unsupported media type" } }
        }

        const etag = computeEtag(track._sourcePath, stats.size, stats.mtimeMs)
        const lastModified = new Date(stats.mtimeMs).toUTCString()
        const totalSize = stats.size

        // 4. Handle Range request
        if (rangeHeader) {
            const range = parseRangeHeader(rangeHeader, totalSize)
            if (!range.valid) {
                return {
                    status: 416,
                    headers: {
                        "Content-Range": `bytes */${totalSize}`,
                        "Accept-Ranges": "bytes",
                        "Content-Type": contentType,
                        "ETag": etag,
                        "Last-Modified": lastModified,
                    },
                    stream: null,
                    totalSize,
                }
            }
            if (!range.satisfiable) {
                return {
                    status: 416,
                    headers: {
                        "Content-Range": `bytes */${totalSize}`,
                        "Accept-Ranges": "bytes",
                        "Content-Type": contentType,
                        "ETag": etag,
                        "Last-Modified": lastModified,
                    },
                    stream: null,
                    totalSize,
                }
            }

            const contentLength = range.end - range.start + 1
            const stream = createReadStream(filePath, { start: range.start, end: range.end })

            return {
                status: 206,
                headers: {
                    "Content-Type": contentType,
                    "Content-Length": String(contentLength),
                    "Content-Range": `bytes ${range.start}-${range.end}/${totalSize}`,
                    "Accept-Ranges": "bytes",
                    "ETag": etag,
                    "Last-Modified": lastModified,
                },
                stream,
                totalSize,
            }
        }

        // 5. Full GET / HEAD
        const stream = createReadStream(filePath)
        return {
            status: 200,
            headers: {
                "Content-Type": contentType,
                "Content-Length": String(totalSize),
                "Accept-Ranges": "bytes",
                "ETag": etag,
                "Last-Modified": lastModified,
            },
            stream,
            totalSize,
        }
    }

    return { streamMedia }
}

export type PlaybackMediaService = ReturnType<typeof createPlaybackMediaService>