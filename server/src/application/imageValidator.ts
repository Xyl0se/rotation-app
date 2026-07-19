import sharp from "sharp"

export const MAX_COVER_SIZE_BYTES = 5 * 1024 * 1024
export const MAX_COVER_PIXELS = 40_000_000

const MIME_BY_FORMAT = {
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
} as const

export type ValidatedImageType = typeof MIME_BY_FORMAT[keyof typeof MIME_BY_FORMAT]

export interface ValidatedImage {
    buffer: Buffer
    contentType: ValidatedImageType
    width: number
    height: number
}

export async function validateImage(buffer: Buffer, claimedContentType?: string): Promise<ValidatedImage> {
    if (buffer.length === 0 || buffer.length > MAX_COVER_SIZE_BYTES) {
        throw new Error("IMAGE_SIZE_INVALID")
    }

    try {
        const image = sharp(buffer, {
            limitInputPixels: MAX_COVER_PIXELS,
            sequentialRead: true,
            failOn: "warning",
        })
        const metadata = await image.metadata()
        const format = metadata.format as keyof typeof MIME_BY_FORMAT | undefined
        const contentType = format ? MIME_BY_FORMAT[format] : undefined
        if (!contentType || !metadata.width || !metadata.height) throw new Error("IMAGE_FORMAT_INVALID")
        if (metadata.width * metadata.height > MAX_COVER_PIXELS) throw new Error("IMAGE_DIMENSIONS_INVALID")
        if (claimedContentType && claimedContentType !== contentType) throw new Error("IMAGE_MIME_MISMATCH")

        // Force a complete decode while keeping the output bounded. This catches truncated
        // pixel data that a metadata-only inspection can miss.
        await image.clone().resize({ width: 1, height: 1, fit: "inside" }).toBuffer()
        return { buffer, contentType, width: metadata.width, height: metadata.height }
    } catch (error) {
        if (error instanceof Error && error.message.startsWith("IMAGE_")) throw error
        throw new Error("IMAGE_DECODE_INVALID", { cause: error })
    }
}
