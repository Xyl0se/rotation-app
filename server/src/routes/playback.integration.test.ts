import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import express from "express"
import type { Server } from "node:http"
import type { AddressInfo } from "node:net"
import { createPlaybackRouter } from "./playback.js"
import type { PlaybackManifestService } from "../application/playbackManifestService.js"

const ALBUM_ID = "550e8400-e29b-41d4-a716-446655440000"

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