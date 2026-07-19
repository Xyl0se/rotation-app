import { afterEach, describe, expect, it, vi } from "vitest"
import { mkdtempSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { createCoverService } from "./coverService.js"

const ALBUM_ID = "550e8400-e29b-41d4-a716-446655440000"
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64")
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xdb, 0, 0])

const temporaryDirectories: string[] = []

function service() {
    const directory = mkdtempSync(join(tmpdir(), "rotation-covers-"))
    temporaryDirectories.push(directory)
    return { directory, coverService: createCoverService(directory) }
}

afterEach(() => {
    vi.unstubAllGlobals()
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

    it("downloads and persists a validated Cover Art Archive image", async () => {
        const { coverService } = service()
        vi.stubGlobal("fetch", vi.fn(async () => new Response(PNG, {
            status: 200,
            headers: { "content-type": "image/png", "content-length": String(PNG.length) },
        })))

        await expect(coverService.resolveRemoteCover(ALBUM_ID, "https://coverartarchive.org/release/id/front"))
            .resolves.toEqual({ status: "cached" })
        expect(coverService.getCoverPath(ALBUM_ID)).toContain(`${ALBUM_ID}.png`)
    })

    it("rejects non-allowlisted cover hosts without fetching", async () => {
        const { coverService } = service()
        const fetchMock = vi.fn()
        vi.stubGlobal("fetch", fetchMock)
        await expect(coverService.resolveRemoteCover(ALBUM_ID, "https://example.com/cover.jpg"))
            .resolves.toEqual({ status: "invalid-image" })
        expect(fetchMock).not.toHaveBeenCalled()
        expect(coverService.getMeta(ALBUM_ID)).toMatchObject({
            resolutionStatus: "invalid-image",
            candidateUrls: [],
            failureCode: "invalid-image",
        })
    })

    it("uses the next bounded candidate when the selected release has no cover", async () => {
        const { coverService } = service()
        const fetchMock = vi.fn()
            .mockResolvedValueOnce(new Response(null, { status: 404 }))
            .mockResolvedValueOnce(new Response(PNG, {
                status: 200,
                headers: { "content-type": "image/png" },
            }))
        vi.stubGlobal("fetch", fetchMock)

        await expect(coverService.resolveRemoteCover(ALBUM_ID, [
            "https://coverartarchive.org/release/first/front",
            "https://coverartarchive.org/release/second/front",
            "https://coverartarchive.org/release/third/front",
            "https://coverartarchive.org/release-group/group/front",
            "https://coverartarchive.org/release/ignored/front",
        ])).resolves.toEqual({ status: "cached" })

        expect(fetchMock).toHaveBeenCalledTimes(2)
        expect(coverService.getMeta(ALBUM_ID)).toMatchObject({
            resolutionStatus: "cached",
            candidateUrls: [
                "https://coverartarchive.org/release/first/front",
                "https://coverartarchive.org/release/second/front",
                "https://coverartarchive.org/release/third/front",
                "https://coverartarchive.org/release-group/group/front",
            ],
        })
    })

    it("persists safe diagnostics and reuses candidates for manual retry", async () => {
        const { coverService } = service()
        vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 404 })))

        await expect(coverService.resolveRemoteCover(ALBUM_ID, [
            "https://coverartarchive.org/release/first/front",
            "https://coverartarchive.org/release/second/front",
        ])).resolves.toEqual({ status: "not-found" })
        expect(coverService.getMeta(ALBUM_ID)).toMatchObject({
            resolutionStatus: "not-found",
            candidateUrls: expect.any(Array),
        })

        const retryFetch = vi.fn()
            .mockResolvedValueOnce(new Response(null, { status: 404 }))
            .mockResolvedValueOnce(new Response(PNG, { status: 200, headers: { "content-type": "image/png" } }))
        vi.stubGlobal("fetch", retryFetch)
        await expect(coverService.resolveRemoteCover(ALBUM_ID, "https://coverartarchive.org/release/first/front"))
            .resolves.toEqual({ status: "cached" })
        expect(retryFetch).toHaveBeenCalledTimes(2)
    })

    it("retains an existing image when every replacement candidate is invalid", async () => {
        const { directory, coverService } = service()
        coverService.saveCover(ALBUM_ID, PNG, "image/png", "upload")
        vi.stubGlobal("fetch", vi.fn(async () => new Response("not an image", {
            status: 200,
            headers: { "content-type": "text/plain" },
        })))

        await expect(coverService.resolveRemoteCover(ALBUM_ID, "https://coverartarchive.org/release/id/front"))
            .resolves.toEqual({ status: "invalid-image" })
        expect(readFileSync(join(directory, "covers", `${ALBUM_ID}.png`))).toEqual(PNG)
        expect(coverService.getMeta(ALBUM_ID)?.resolutionStatus).toBe("invalid-image")
    })
})
