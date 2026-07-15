import { afterEach, describe, expect, it } from "vitest"
import { mkdtempSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { createCoverService } from "./coverService.js"

const ALBUM_ID = "550e8400-e29b-41d4-a716-446655440000"
const PNG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0])
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xdb, 0, 0])

const temporaryDirectories: string[] = []

function service() {
    const directory = mkdtempSync(join(tmpdir(), "rotation-covers-"))
    temporaryDirectories.push(directory)
    return { directory, coverService: createCoverService(directory) }
}

afterEach(() => {
    for (const directory of temporaryDirectories.splice(0)) {
        rmSync(directory, { recursive: true, force: true })
    }
})

describe("coverService security", () => {
    it.each([
        "../rotation",
        "../../etc/passwd",
        "/absolute/path",
        "not-a-uuid",
        "550e8400-e29b-41d4-a716-446655440000/child",
        "550e8400-e29b-41d4-a716-446655440000\0.jpg",
    ])("rejects unsafe album ID %s", (albumId) => {
        const { coverService } = service()

        expect(() => coverService.saveCover(albumId, PNG, "image/png", "upload"))
            .toThrow("Invalid album ID")
        expect(() => coverService.getCoverPath(albumId)).toThrow("Invalid album ID")
        expect(() => coverService.deleteCover(albumId)).toThrow("Invalid album ID")
    })

    it("rejects content whose signature does not match the declared MIME type", () => {
        const { coverService } = service()

        expect(() => coverService.saveCover(ALBUM_ID, JPEG, "image/png", "upload"))
            .toThrow("Image content does not match its content type")
        expect(coverService.getCoverPath(ALBUM_ID)).toBeNull()
    })

    it("rejects unsupported image types", () => {
        const { coverService } = service()

        expect(() => coverService.saveCover(ALBUM_ID, PNG, "image/svg+xml", "upload"))
            .toThrow("Invalid content type")
    })

    it("rejects covers larger than five megabytes", () => {
        const { coverService } = service()
        const oversized = Buffer.alloc(5 * 1024 * 1024 + 1)

        expect(() => coverService.saveCover(ALBUM_ID, oversized, "image/png", "upload"))
            .toThrow("Cover exceeds maximum size")
    })

    it("writes validated image data and metadata inside the cover directory", () => {
        const { directory, coverService } = service()

        coverService.saveCover(ALBUM_ID, PNG, "image/png", "upload")

        expect(coverService.getCoverPath(ALBUM_ID)).toBe(join(directory, "covers", `${ALBUM_ID}.png`))
        expect(readFileSync(join(directory, "covers", `${ALBUM_ID}.png`))).toEqual(PNG)
        expect(coverService.getMeta(ALBUM_ID)).toMatchObject({
            contentType: "image/png",
            source: "upload",
        })
    })

    it("removes an old extension only after a replacement is ready", () => {
        const { directory, coverService } = service()
        coverService.saveCover(ALBUM_ID, PNG, "image/png", "upload")

        coverService.saveCover(ALBUM_ID, JPEG, "image/jpeg", "upload")

        expect(coverService.getCoverPath(ALBUM_ID)).toBe(join(directory, "covers", `${ALBUM_ID}.jpg`))
        expect(() => readFileSync(join(directory, "covers", `${ALBUM_ID}.png`))).toThrow()
    })
})
