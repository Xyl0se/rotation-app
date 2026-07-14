import { writeFileSync, readFileSync, existsSync, unlinkSync, mkdirSync } from "node:fs"
import { join, extname } from "node:path"

export interface CoverMeta {
    contentType: string
    uploadedAt: string
    source?: "upload" | "url" | "alternative"
}

const MAX_COVER_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB

const VALID_IMAGE_TYPES = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
])

export function createCoverService(dataDir: string) {
    const coversDir = join(dataDir, "covers")
    mkdirSync(coversDir, { recursive: true })

    function getCoverPath(albumId: string): string | null {
        for (const ext of [".jpg", ".jpeg", ".png", ".webp", ".gif"]) {
            const path = join(coversDir, `${albumId}${ext}`)
            if (existsSync(path)) {
                return path
            }
        }
        return null
    }

    function getMetaPath(albumId: string): string {
        return join(coversDir, `${albumId}.json`)
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

    return {
        coversDir,

        saveCover(albumId: string, buffer: Buffer, contentType: string, source?: "upload" | "url" | "alternative"): void {
            if (buffer.length > MAX_COVER_SIZE_BYTES) {
                throw new Error(`Cover exceeds maximum size of ${MAX_COVER_SIZE_BYTES} bytes`)
            }

            if (!VALID_IMAGE_TYPES.has(contentType)) {
                throw new Error(`Invalid content type: ${contentType}. Must be an image.`)
            }

            // Delete existing cover for this album
            this.deleteCover(albumId)

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

            const filePath = join(coversDir, `${albumId}${ext}`)
            writeFileSync(filePath, buffer)

            const meta: CoverMeta = {
                contentType,
                uploadedAt: new Date().toISOString(),
                source,
            }
            writeFileSync(getMetaPath(albumId), JSON.stringify(meta))
        },

        getCoverPath(albumId: string): string | null {
            return getCoverPath(albumId)
        },

        deleteCover(albumId: string): boolean {
            let deleted = false
            for (const ext of [".jpg", ".jpeg", ".png", ".webp", ".gif"]) {
                const path = join(coversDir, `${albumId}${ext}`)
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
            return deleted
        },

        getContentType(albumId: string): string | null {
            const metaPath = getMetaPath(albumId)
            if (existsSync(metaPath)) {
                try {
                    const meta = JSON.parse(readFileSync(metaPath, "utf-8")) as CoverMeta
                    return meta.contentType
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
            const metaPath = getMetaPath(albumId)
            if (!existsSync(metaPath)) {
                return null
            }
            try {
                return JSON.parse(readFileSync(metaPath, "utf-8")) as CoverMeta
            } catch {
                return null
            }
        },
    }
}

export type CoverService = ReturnType<typeof createCoverService>
