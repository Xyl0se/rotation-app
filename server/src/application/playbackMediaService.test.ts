import { describe, expect, it, beforeAll, afterAll } from "vitest"
import { writeFileSync, mkdirSync, rmSync, existsSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import type { ReadStream } from "node:fs"
import { createPlaybackMediaService, parseRangeHeader } from "./playbackMediaService.js"
import type { BindingRepository } from "../infrastructure/persistence/sqlite/bindingRepository.js"
import type { PlaybackManifestRepository } from "../infrastructure/persistence/sqlite/playbackManifestRepository.js"

const TEST_ALBUM_ID = "550e8400-e29b-41d4-a716-446655440000"
const TEST_TRACK_ID = "abc123def45678901234567890123456"

function makeBindingRepo(state: "confirmed" | "proposed" | "missing" | null = "confirmed") {
    return {
        findByLibraryAlbumId: () => state === null ? undefined : {
            album_id: "Artist/Album",
            relative_path: "Artist/Album",
            state,
            library_album_id: TEST_ALBUM_ID,
        },
    } as unknown as BindingRepository
}

function makeManifestRepo(tracks: Array<{ opaqueTrackId: string; _sourcePath: string }> = []) {
    return {
        getManifest: () => ({
            albumId: TEST_ALBUM_ID,
            manifest: {
                albumId: TEST_ALBUM_ID,
                title: "Album",
                artist: "Artist",
                coverPath: null,
                totalDuration: null,
                tracks: tracks.map(t => ({
                    opaqueTrackId: t.opaqueTrackId,
                    discNumber: 1,
                    trackNumber: 1,
                    title: "Track",
                    duration: 100,
                    mediaType: "mp3" as const,
                    playable: true,
                    _sourcePath: t._sourcePath,
                })),
                orderingDiagnostic: "ok" as const,
            },
            orderingDiagnostic: "ok" as const,
            filenameFallbackUsed: false,
            cachedAt: new Date().toISOString(),
            invalidatedAt: null,
        }),
    } as unknown as PlaybackManifestRepository
}

function makePathGuard(base: string) {
    return (relativePath: string) => join(base, relativePath)
}

function consumeStream(stream: ReadStream): Promise<void> {
    return new Promise((resolve) => {
        stream.on("end", () => resolve())
        stream.on("error", () => resolve())
        stream.resume()
    })
}

describe("parseRangeHeader", () => {
    it("returns valid range for bytes=0-99", () => {
        const result = parseRangeHeader("bytes=0-99", 500)
        expect(result.valid).toBe(true)
        expect(result.satisfiable).toBe(true)
        expect(result.start).toBe(0)
        expect(result.end).toBe(99)
        expect(result.total).toBe(500)
    })

    it("returns valid range for bytes=100-200", () => {
        const result = parseRangeHeader("bytes=100-200", 500)
        expect(result.valid).toBe(true)
        expect(result.satisfiable).toBe(true)
        expect(result.start).toBe(100)
        expect(result.end).toBe(200)
    })

    it("clamps end to file size minus one", () => {
        const result = parseRangeHeader("bytes=400-600", 500)
        expect(result.valid).toBe(true)
        expect(result.satisfiable).toBe(true)
        expect(result.start).toBe(400)
        expect(result.end).toBe(499)
    })

    it("returns unsatisfiable when start >= totalSize", () => {
        const result = parseRangeHeader("bytes=500-600", 500)
        expect(result.valid).toBe(true)
        expect(result.satisfiable).toBe(false)
    })

    it("returns invalid for malformed prefix", () => {
        const result = parseRangeHeader("items=0-99", 500)
        expect(result.valid).toBe(false)
    })

    it("returns invalid for multi-range", () => {
        const result = parseRangeHeader("bytes=0-1,2-3", 500)
        expect(result.valid).toBe(false)
    })

    it("returns invalid for suffix range", () => {
        const result = parseRangeHeader("bytes=-100", 500)
        expect(result.valid).toBe(false)
    })

    it("returns invalid for open-ended range", () => {
        const result = parseRangeHeader("bytes=100-", 500)
        expect(result.valid).toBe(false)
    })

    it("returns invalid for start > end", () => {
        const result = parseRangeHeader("bytes=200-100", 500)
        expect(result.valid).toBe(false)
    })

    it("returns invalid for negative start", () => {
        const result = parseRangeHeader("bytes=-1-10", 500)
        expect(result.valid).toBe(false)
    })

    it("returns invalid for missing parts", () => {
        const result = parseRangeHeader("bytes=100", 500)
        expect(result.valid).toBe(false)
    })
})

describe("playback media service", () => {
    let tempDir: string

    beforeAll(() => {
        tempDir = join(tmpdir(), `rotation-media-svc-test-${Date.now()}`)
        mkdirSync(tempDir, { recursive: true })
        writeFileSync(join(tempDir, "test.mp3"), Buffer.alloc(500, 0xFF))
        writeFileSync(join(tempDir, "test.flac"), Buffer.alloc(100, 0xAA))
        writeFileSync(join(tempDir, "test.m4a"), Buffer.alloc(100, 0xBB))
    })

    afterAll(() => {
        if (existsSync(tempDir)) {
            rmSync(tempDir, { recursive: true, force: true })
        }
    })

    it("returns 404 when binding not found", () => {
        const service = createPlaybackMediaService(
            makeBindingRepo(null),
            makeManifestRepo(),
            makePathGuard(tempDir),
        )
        const result = service.streamMedia(TEST_ALBUM_ID, TEST_TRACK_ID, undefined)
        expect("status" in result && result.status).toBe(404)
        if ("body" in result) {
            expect(result.body.error).toBe("Album or binding not found")
        }
    })

    it("returns 404 when binding not confirmed", () => {
        const service = createPlaybackMediaService(
            makeBindingRepo("proposed"),
            makeManifestRepo(),
            makePathGuard(tempDir),
        )
        const result = service.streamMedia(TEST_ALBUM_ID, TEST_TRACK_ID, undefined)
        expect("status" in result && result.status).toBe(404)
    })

    it("returns 404 when manifest is invalidated", () => {
        const manifestRepo = makeManifestRepo()
        manifestRepo.getManifest = () => ({
            albumId: TEST_ALBUM_ID,
            manifest: {
                albumId: TEST_ALBUM_ID,
                title: "Album",
                artist: "Artist",
                coverPath: null,
                totalDuration: null,
                tracks: [],
                orderingDiagnostic: "ok" as const,
            },
            orderingDiagnostic: "ok" as const,
            filenameFallbackUsed: false,
            cachedAt: new Date().toISOString(),
            invalidatedAt: new Date().toISOString(),
        })
        const service = createPlaybackMediaService(
            makeBindingRepo(),
            manifestRepo,
            makePathGuard(tempDir),
        )
        const result = service.streamMedia(TEST_ALBUM_ID, TEST_TRACK_ID, undefined)
        expect("status" in result && result.status).toBe(404)
        if ("body" in result) {
            expect(result.body.error).toBe("Manifest not available")
        }
    })

    it("returns 404 when track not in manifest", () => {
        const service = createPlaybackMediaService(
            makeBindingRepo(),
            makeManifestRepo([{ opaqueTrackId: "other", _sourcePath: "other.mp3" }]),
            makePathGuard(tempDir),
        )
        const result = service.streamMedia(TEST_ALBUM_ID, TEST_TRACK_ID, undefined)
        expect("status" in result && result.status).toBe(404)
        if ("body" in result) {
            expect(result.body.error).toBe("Track not found")
        }
    })

    it("returns 200 with full file stream", async () => {
        const service = createPlaybackMediaService(
            makeBindingRepo(),
            makeManifestRepo([{ opaqueTrackId: TEST_TRACK_ID, _sourcePath: "test.mp3" }]),
            makePathGuard(tempDir),
        )
        const result = service.streamMedia(TEST_ALBUM_ID, TEST_TRACK_ID, undefined)
        expect("status" in result && result.status).toBe(200)
        if ("stream" in result) {
            expect(result.headers["Content-Type"]).toBe("audio/mpeg")
            expect(result.headers["Content-Length"]).toBe("500")
            expect(result.headers["Accept-Ranges"]).toBe("bytes")
            expect(result.stream).not.toBeNull()
            if (result.stream) await consumeStream(result.stream)
        }
    })

    it("returns 206 with partial stream for valid range", async () => {
        const service = createPlaybackMediaService(
            makeBindingRepo(),
            makeManifestRepo([{ opaqueTrackId: TEST_TRACK_ID, _sourcePath: "test.mp3" }]),
            makePathGuard(tempDir),
        )
        const result = service.streamMedia(TEST_ALBUM_ID, TEST_TRACK_ID, "bytes=0-99")
        expect("status" in result && result.status).toBe(206)
        if ("stream" in result) {
            expect(result.headers["Content-Type"]).toBe("audio/mpeg")
            expect(result.headers["Content-Length"]).toBe("100")
            expect(result.headers["Content-Range"]).toBe("bytes 0-99/500")
            expect(result.stream).not.toBeNull()
            if (result.stream) await consumeStream(result.stream)
        }
    })

    it("returns 416 for unsatisfiable range", () => {
        const service = createPlaybackMediaService(
            makeBindingRepo(),
            makeManifestRepo([{ opaqueTrackId: TEST_TRACK_ID, _sourcePath: "test.mp3" }]),
            makePathGuard(tempDir),
        )
        const result = service.streamMedia(TEST_ALBUM_ID, TEST_TRACK_ID, "bytes=500-600")
        expect("status" in result && result.status).toBe(416)
        if ("stream" in result) {
            expect(result.stream).toBeNull()
            expect(result.headers["Content-Range"]).toBe("bytes */500")
        }
    })

    it("returns 416 for invalid range format", () => {
        const service = createPlaybackMediaService(
            makeBindingRepo(),
            makeManifestRepo([{ opaqueTrackId: TEST_TRACK_ID, _sourcePath: "test.mp3" }]),
            makePathGuard(tempDir),
        )
        const result = service.streamMedia(TEST_ALBUM_ID, TEST_TRACK_ID, "bytes=0-1,2-3")
        expect("status" in result && result.status).toBe(416)
    })

    it("returns correct content type for flac", async () => {
        const service = createPlaybackMediaService(
            makeBindingRepo(),
            makeManifestRepo([{ opaqueTrackId: TEST_TRACK_ID, _sourcePath: "test.flac" }]),
            makePathGuard(tempDir),
        )
        const result = service.streamMedia(TEST_ALBUM_ID, TEST_TRACK_ID, undefined)
        expect("status" in result && result.status).toBe(200)
        if ("stream" in result) {
            expect(result.headers["Content-Type"]).toBe("audio/flac")
            if (result.stream) await consumeStream(result.stream)
        }
    })

    it("returns correct content type for m4a", async () => {
        const service = createPlaybackMediaService(
            makeBindingRepo(),
            makeManifestRepo([{ opaqueTrackId: TEST_TRACK_ID, _sourcePath: "test.m4a" }]),
            makePathGuard(tempDir),
        )
        const result = service.streamMedia(TEST_ALBUM_ID, TEST_TRACK_ID, undefined)
        expect("status" in result && result.status).toBe(200)
        if ("stream" in result) {
            expect(result.headers["Content-Type"]).toBe("audio/mp4")
            if (result.stream) await consumeStream(result.stream)
        }
    })

    it("redacts source paths from error responses", () => {
        const service = createPlaybackMediaService(
            makeBindingRepo(),
            makeManifestRepo([{ opaqueTrackId: TEST_TRACK_ID, _sourcePath: "test.mp3" }]),
            makePathGuard(tempDir),
        )
        const result = service.streamMedia(TEST_ALBUM_ID, "wrong-id", undefined)
        expect("status" in result && result.status).toBe(404)
        if ("body" in result) {
            expect(result.body.error).not.toContain(tempDir)
            expect(result.body.error).not.toContain("test.mp3")
        }
    })

    it("includes etag and last-modified headers", async () => {
        const service = createPlaybackMediaService(
            makeBindingRepo(),
            makeManifestRepo([{ opaqueTrackId: TEST_TRACK_ID, _sourcePath: "test.mp3" }]),
            makePathGuard(tempDir),
        )
        const result = service.streamMedia(TEST_ALBUM_ID, TEST_TRACK_ID, undefined)
        expect("status" in result && result.status).toBe(200)
        if ("stream" in result) {
            expect(result.headers["ETag"]).toMatch(/^"[a-f0-9]{16}"$/)
            expect(result.headers["Last-Modified"]).toMatch(/^[A-Z][a-z]{2}, \d{2} [A-Z][a-z]{2} \d{4} \d{2}:\d{2}:\d{2} GMT$/)
            if (result.stream) await consumeStream(result.stream)
        }
    })
})