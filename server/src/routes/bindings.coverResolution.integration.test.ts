import { afterAll, beforeAll, describe, expect, it, vi } from "vitest"
import express from "express"
import type { Server } from "node:http"
import type { AddressInfo } from "node:net"
import { createBindingsRouter } from "./bindings.js"
import type { BindingRepository } from "../infrastructure/persistence/sqlite/bindingRepository.js"
import type { BindingCaptureService } from "../application/bindingCaptureService.js"

const LIBRARY_ALBUM_ID = "550e8400-e29b-41d4-a716-446655440000"

describe("binding cover resolution hooks", () => {
    let server: Server
    let baseUrl: string
    const resolveCover = vi.fn(async () => undefined)

    beforeAll(async () => {
        const binding = {
            album_id: "Artist/Album",
            relative_path: "Artist/Album",
            state: "confirmed" as const,
            match_source: "manual" as const,
            proposed_at: null,
            confirmed_at: new Date().toISOString(),
            library_album_id: LIBRARY_ALBUM_ID,
            title: "Album",
            artist: "Artist",
        }
        const bindingRepo = {
            findById: vi.fn(() => binding),
            findWithAlbumDataById: vi.fn(() => binding),
            confirm: vi.fn(() => true),
        } as unknown as BindingRepository
        const captureService = {
            capture: vi.fn(() => ({
                album: { id: LIBRARY_ALBUM_ID },
                binding,
            })),
        } as unknown as BindingCaptureService
        const app = express()
        app.use(express.json())
        app.use("/bindings", createBindingsRouter(
            bindingRepo,
            relativePath => `/music/${relativePath}`,
            captureService,
            undefined,
            undefined,
            resolveCover,
        ))
        await new Promise<void>((resolve, reject) => {
            server = app.listen(0, "127.0.0.1", () => {
                baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
                resolve()
            })
            server.on("error", reject)
        })
    })

    afterAll(async () => {
        await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()))
    })

    it("resolves artwork after manual confirmation", async () => {
        const response = await fetch(`${baseUrl}/bindings/confirm`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ albumId: "Artist/Album" }),
        })
        expect(response.status).toBe(200)
        expect(resolveCover).toHaveBeenCalledWith(LIBRARY_ALBUM_ID)
    })

    it("resolves artwork after atomic capture", async () => {
        const response = await fetch(`${baseUrl}/bindings/capture`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                albumId: "Artist/Album",
                album: {
                    id: LIBRARY_ALBUM_ID,
                    title: "Album",
                    artist: "Artist",
                    year: "",
                    roleHistory: [],
                    listenCount: 0,
                    lastListened: null,
                    createdAt: new Date().toISOString(),
                },
            }),
        })
        expect(response.status).toBe(201)
        expect(resolveCover).toHaveBeenCalledWith(LIBRARY_ALBUM_ID)
    })
})
