import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import express from "express"
import type { Server } from "node:http"
import type { AddressInfo } from "node:net"
import { writeFileSync, mkdirSync, rmSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { createPlaybackRouter } from "./playback.js"
import type { PlaybackManifestService } from "../application/playbackManifestService.js"
import type { PlaybackMediaService } from "../application/playbackMediaService.js"

const ALBUM_ID = "550e8400-e29b-41d4-a716-446655440000"
const TRACK_ID = "abc123def45678901234567890123456"

let tempDir: string

describe("playback manifest route", () => {
    let server: Server
    let baseUrl: string
    const getManifest = vi.fn()

    beforeAll(async () => {
        const service = { getManifest } as unknown as PlaybackManifestService
        const app = express()
        app.use("/playback", createPlaybackRouter(service))
        await new Promise<void>((resolve, reject) => {
            server = app.listen(0, "127.0.0.1", () => {
                baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
                resolve()
            })
            server.on("error", reject)
        })
    })

    beforeEach(() => {
        getManifest.mockReset()
    })

    afterAll(async () => {
        await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()))
    })

    it("returns manifest for a valid album", async () => {
        getManifest.mockResolvedValue({
            manifest: {
                albumId: ALBUM_ID,
                title: "OK Computer",
                artist: "Radiohead",
                coverPath: `/covers/${ALBUM_ID}`,
                totalDuration: 2400,
                tracks: [
                    {
                        opaqueTrackId: "abc123",
                        discNumber: 1,
                        trackNumber: 1,
                        title: "Airbag",
                        duration: 300,
                        mediaType: "mp3",
                        playable: true,
                    },
                ],
                orderingDiagnostic: "ok",
            },
            orderingDiagnostic: "ok",
            filenameFallbackUsed: false,
        })

        const response = await fetch(`${baseUrl}/playback/manifest/${ALBUM_ID}`)
        expect(response.status).toBe(200)
        const body = await response.json()
        expect(body.albumId).toBe(ALBUM_ID)
        expect(body.tracks).toHaveLength(1)
        expect(body.tracks[0].opaqueTrackId).toBe("abc123")
        expect(body.coverPath).toBe(`/covers/${ALBUM_ID}`)
    })

    it("returns 404 for not-found binding", async () => {
        getManifest.mockResolvedValue({ code: "not-found" })
        const response = await fetch(`${baseUrl}/playback/manifest/${ALBUM_ID}`)
        expect(response.status).toBe(404)
        const body = await response.json()
        expect(body.error).toBe("Album or binding not found")
    })

    it("returns 404 for not-confirmed binding", async () => {
        getManifest.mockResolvedValue({ code: "not-confirmed" })
        const response = await fetch(`${baseUrl}/playback/manifest/${ALBUM_ID}`)
        expect(response.status).toBe(404)
        const body = await response.json()
        expect(body.error).toBe("Album or binding not found")
    })

    it("returns 503 for ambiguous track ordering", async () => {
        getManifest.mockResolvedValue({ code: "ambiguous-order", diagnostic: "duplicate-positions" })
        const response = await fetch(`${baseUrl}/playback/manifest/${ALBUM_ID}`)
        expect(response.status).toBe(503)
        const body = await response.json()
        expect(body.error).toBe("Album has ambiguous track ordering")
        expect(body.diagnostic).toBe("duplicate-positions")
    })

    it("never exposes source paths in error responses", async () => {
        getManifest.mockResolvedValue({ code: "not-found" })
        const response = await fetch(`${baseUrl}/playback/manifest/${ALBUM_ID}`)
        const body = await response.json()
        expect(body).not.toHaveProperty("path")
        expect(body).not.toHaveProperty("relativePath")
        expect(body).not.toHaveProperty("source")
    })
})

describe("playback media delivery route", () => {
    let server: Server
    let baseUrl: string
    const streamMedia = vi.fn()

    beforeAll(async () => {
        tempDir = join(tmpdir(), `rotation-media-test-${Date.now()}`)
        mkdirSync(tempDir, { recursive: true })
        const testFile = join(tempDir, "track.mp3")
        writeFileSync(testFile, Buffer.alloc(500, 0xFF))

        const manifestService = { getManifest: vi.fn() } as unknown as PlaybackManifestService

        const mediaService = {
            streamMedia: (...args: Parameters<PlaybackMediaService["streamMedia"]>) => streamMedia(...args),
        } as unknown as PlaybackMediaService

        const app = express()
        app.use("/playback", createPlaybackRouter(manifestService, mediaService))

        await new Promise<void>((resolve, reject) => {
            server = app.listen(0, "127.0.0.1", () => {
                baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
                resolve()
            })
            server.on("error", reject)
        })
    })

    beforeEach(() => {
        streamMedia.mockReset()
    })

    afterAll(async () => {
        await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()))
        rmSync(tempDir, { recursive: true, force: true })
    })

    it("returns 404 for missing album", async () => {
        streamMedia.mockReturnValue({ status: 404, body: { error: "Album or binding not found" } })
        const response = await fetch(`${baseUrl}/playback/media/${ALBUM_ID}/${TRACK_ID}`)
        expect(response.status).toBe(404)
        const body = await response.json()
        expect(body.error).toBe("Album or binding not found")
    })

    it("returns 404 for track not in manifest", async () => {
        streamMedia.mockReturnValue({ status: 404, body: { error: "Track not found" } })
        const response = await fetch(`${baseUrl}/playback/media/${ALBUM_ID}/${TRACK_ID}`)
        expect(response.status).toBe(404)
        const body = await response.json()
        expect(body.error).toBe("Track not found")
    })

    it("HEAD returns headers without body", async () => {
        streamMedia.mockReturnValue({
            status: 200,
            headers: {
                "Content-Type": "audio/mpeg",
                "Content-Length": "500",
                "Accept-Ranges": "bytes",
                "ETag": '"abc123"',
                "Last-Modified": "Mon, 01 Jan 2024 00:00:00 GMT",
            },
            stream: null,
            totalSize: 500,
        })
        const response = await fetch(`${baseUrl}/playback/media/${ALBUM_ID}/${TRACK_ID}`, { method: "HEAD" })
        expect(response.status).toBe(200)
        expect(response.headers.get("content-type")).toBe("audio/mpeg")
        expect(response.headers.get("content-length")).toBe("500")
        expect(response.headers.get("accept-ranges")).toBe("bytes")
        expect(response.headers.get("x-content-type-options")).toBe("nosniff")
        expect(response.headers.get("content-security-policy")).toBe("default-src 'none'")
        const body = await response.text()
        expect(body).toBe("")
    })

    it("GET returns full file stream", async () => {
        const { createReadStream } = await import("node:fs")
        const testFile = join(tempDir, "track.mp3")
        streamMedia.mockReturnValue({
            status: 200,
            headers: {
                "Content-Type": "audio/mpeg",
                "Content-Length": "500",
                "Accept-Ranges": "bytes",
                "ETag": '"abc123"',
                "Last-Modified": "Mon, 01 Jan 2024 00:00:00 GMT",
            },
            stream: createReadStream(testFile),
            totalSize: 500,
        })
        const response = await fetch(`${baseUrl}/playback/media/${ALBUM_ID}/${TRACK_ID}`)
        expect(response.status).toBe(200)
        expect(response.headers.get("content-type")).toBe("audio/mpeg")
        expect(response.headers.get("content-length")).toBe("500")
        const body = await response.arrayBuffer()
        expect(body.byteLength).toBe(500)
    })

    it("GET with valid Range returns 206 partial content", async () => {
        const { createReadStream } = await import("node:fs")
        const testFile = join(tempDir, "track.mp3")
        streamMedia.mockReturnValue({
            status: 206,
            headers: {
                "Content-Type": "audio/mpeg",
                "Content-Length": "100",
                "Content-Range": "bytes 0-99/500",
                "Accept-Ranges": "bytes",
            },
            stream: createReadStream(testFile, { start: 0, end: 99 }),
            totalSize: 500,
        })
        const response = await fetch(`${baseUrl}/playback/media/${ALBUM_ID}/${TRACK_ID}`, {
            headers: { Range: "bytes=0-99" },
        })
        expect(response.status).toBe(206)
        expect(response.headers.get("content-range")).toBe("bytes 0-99/500")
        expect(response.headers.get("content-length")).toBe("100")
        const body = await response.arrayBuffer()
        expect(body.byteLength).toBe(100)
    })

    it("GET with unsatisfiable Range returns 416", async () => {
        streamMedia.mockReturnValue({
            status: 416,
            headers: {
                "Content-Range": "bytes */500",
                "Accept-Ranges": "bytes",
                "Content-Type": "audio/mpeg",
            },
            stream: null,
            totalSize: 500,
        })
        const response = await fetch(`${baseUrl}/playback/media/${ALBUM_ID}/${TRACK_ID}`, {
            headers: { Range: "bytes=500-600" },
        })
        expect(response.status).toBe(416)
        expect(response.headers.get("content-range")).toBe("bytes */500")
    })

    it("GET with multi-range returns 416", async () => {
        streamMedia.mockReturnValue({
            status: 416,
            headers: {
                "Content-Range": "bytes */500",
                "Accept-Ranges": "bytes",
                "Content-Type": "audio/mpeg",
            },
            stream: null,
            totalSize: 500,
        })
        const response = await fetch(`${baseUrl}/playback/media/${ALBUM_ID}/${TRACK_ID}`, {
            headers: { Range: "bytes=0-1,2-3" },
        })
        expect(response.status).toBe(416)
    })

    it("never exposes source paths in media error responses", async () => {
        streamMedia.mockReturnValue({ status: 404, body: { error: "Track not found" } })
        const response = await fetch(`${baseUrl}/playback/media/${ALBUM_ID}/${TRACK_ID}`)
        const body = await response.json()
        expect(body).not.toHaveProperty("path")
        expect(body).not.toHaveProperty("relativePath")
        expect(body).not.toHaveProperty("source")
    })

    it("calls streamMedia with correct albumId, trackId and rangeHeader", async () => {
        streamMedia.mockReturnValue({ status: 404, body: { error: "Track not found" } })
        await fetch(`${baseUrl}/playback/media/${ALBUM_ID}/${TRACK_ID}`, {
            headers: { Range: "bytes=0-99" },
        })
        expect(streamMedia).toHaveBeenCalledWith(ALBUM_ID, TRACK_ID, "bytes=0-99")
    })
})