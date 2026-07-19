import { describe, expect, it } from "vitest"
import sharp from "sharp"
import { validateImage } from "./imageValidator.js"

describe("image validator", () => {
    it("fully decodes a bounded supported image", async () => {
        const input = await sharp({
            create: { width: 8, height: 6, channels: 3, background: "navy" },
        }).png().toBuffer()

        await expect(validateImage(input, "image/png")).resolves.toMatchObject({
            contentType: "image/png",
            width: 8,
            height: 6,
        })
    })

    it("rejects MIME mismatches, truncated images, and oversized input", async () => {
        const valid = await sharp({
            create: { width: 2, height: 2, channels: 3, background: "red" },
        }).jpeg().toBuffer()

        await expect(validateImage(valid, "image/png")).rejects.toThrow("IMAGE_MIME_MISMATCH")
        await expect(validateImage(valid.subarray(0, 20), "image/jpeg")).rejects.toThrow("IMAGE_DECODE_INVALID")
        await expect(validateImage(Buffer.alloc(5 * 1024 * 1024 + 1))).rejects.toThrow("IMAGE_SIZE_INVALID")
    })
})
