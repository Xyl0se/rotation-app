import express from "express"
import type Database from "better-sqlite3"
import type { Server } from "node:http"
import type { AddressInfo } from "node:net"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { initDatabase } from "../infrastructure/persistence/sqlite/connection.js"
import { createAlbumRepository } from "../infrastructure/persistence/sqlite/albumRepository.js"
import { createRotationStateRepository } from "../infrastructure/persistence/sqlite/rotationStateRepository.js"
import { createRequireWriteTokenForMutations } from "./middleware/writeToken.js"
import { createRotationStateRouter } from "./rotationState.js"

const TOKEN = "rotation-state-integration-token"
const ALBUM_A = "550e8400-e29b-41d4-a716-446655440010"
const ALBUM_B = "550e8400-e29b-41d4-a716-446655440011"
const OUTSIDER = "550e8400-e29b-41d4-a716-446655440012"
const PLAN_ID = "550e8400-e29b-41d4-a716-446655440020"
const EVENT_ID = "550e8400-e29b-41d4-a716-446655440030"

function plan(status: "draft" | "active" = "active") {
    return {
        id: PLAN_ID,
        name: "Integration Rotation",
        targetSize: 2,
        items: [
            { albumId: ALBUM_A, role: "new", reason: "quota" },
            { albumId: ALBUM_B, role: "growing", reason: "quota" },
        ],
        albumIds: [ALBUM_A, ALBUM_B],
        roleQuotas: [
            { role: "new", targetCount: 1 },
            { role: "growing", targetCount: 1 },
        ],
        createdAt: "2026-07-16T10:00:00.000Z",
        acceptedAt: status === "active" ? "2026-07-16T10:01:00.000Z" : undefined,
        status,
        focusAlbumId: null,
    }
}

describe("rotation state route contract", () => {
    let database: Database.Database
    let server: Server
    let baseUrl: string

    beforeAll(async () => {
        database = initDatabase(":memory:")
        const albums = createAlbumRepository(database)
        for (const [id, title] of [[ALBUM_A, "Alpha"], [ALBUM_B, "Beta"], [OUTSIDER, "Outside"]]) {
            albums.save({ id, title, artist: "Artist", year: "2026", roleHistory: [], listenCount: 0, lastListened: null })
        }
        const app = express()
        app.use(express.json())
        app.use("/rotation-state", createRequireWriteTokenForMutations(TOKEN), createRotationStateRouter(createRotationStateRepository(database)))
        await new Promise<void>((resolve, reject) => {
            server = app.listen(0, "127.0.0.1")
            server.once("listening", () => {
                baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
                resolve()
            })
            server.once("error", reject)
        })
    })

    afterAll(async () => {
        await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()))
        database.close()
    })

    function request(method: string, path: string, body?: unknown, token = TOKEN) {
        return fetch(`${baseUrl}${path}`, {
            method,
            headers: { "content-type": "application/json", "x-rotation-write-token": token },
            body: body === undefined ? undefined : JSON.stringify(body),
        })
    }

    it("allows reads without a write token and protects mutations", async () => {
        expect((await fetch(`${baseUrl}/rotation-state`)).status).toBe(200)
        expect((await request("PUT", "/rotation-state/plan", plan(), "wrong-token")).status).toBe(403)
    })

    it("serves and updates validated server-owned Rotation settings", async () => {
        const initial = await (await fetch(`${baseUrl}/rotation-state/settings`)).json()
        expect(initial).toEqual({
            targetSize: 25,
            roleQuotas: [
                { role: "new", targetCount: 10 },
                { role: "comfort-food", targetCount: 5 },
                { role: "classic", targetCount: 5 },
                { role: "growing", targetCount: 5 },
            ],
        })
        const custom = { ...initial, targetSize: 12, roleQuotas: initial.roleQuotas.map((quota: { role: string; targetCount: number }) => ({ ...quota, targetCount: 3 })) }
        const saved = await request("PUT", "/rotation-state/settings", custom)
        expect(saved.status).toBe(200)
        await expect(saved.json()).resolves.toEqual(custom)

        const invalid = await request("PUT", "/rotation-state/settings", { targetSize: 0, roleQuotas: [] })
        expect(invalid.status).toBe(400)
        await expect(fetch(`${baseUrl}/rotation-state/settings`).then(response => response.json())).resolves.toEqual(custom)
    })

    it("rejects malformed or internally inconsistent plans", async () => {
        const response = await request("PUT", "/rotation-state/plan", { ...plan(), albumIds: [ALBUM_A] })
        expect(response.status).toBe(400)
        await expect(response.json()).resolves.toMatchObject({ code: "VALIDATION_ERROR" })
    })

    it("persists one canonical active plan and serves it after reload", async () => {
        expect((await request("PUT", "/rotation-state/plan", plan())).status).toBe(200)
        const state = await (await fetch(`${baseUrl}/rotation-state`)).json()
        expect(state.active).toMatchObject({ id: PLAN_ID, albumIds: [ALBUM_A, ALBUM_B], focusAlbumId: null })
        expect(state.draft).toBeNull()
    })

    it("rejects focus outside the active Rotation and accepts a member", async () => {
        expect((await request("PUT", "/rotation-state/focus", { albumId: OUTSIDER })).status).toBe(409)
        const accepted = await request("PUT", "/rotation-state/focus", { albumId: ALBUM_A })
        expect(accepted.status).toBe(200)
        await expect(accepted.json()).resolves.toMatchObject({ focusAlbumId: ALBUM_A })
    })

    it("chooses random focus exclusively from active Rotation members", async () => {
        const response = await request("POST", "/rotation-state/focus/random")
        expect(response.status).toBe(200)
        const selected = (await response.json()).focusAlbumId
        expect([ALBUM_A, ALBUM_B]).toContain(selected)
    })

    it("stores a listening event idempotently and updates derived Album data once", async () => {
        const event = { id: EVENT_ID, albumId: ALBUM_A, listenedAt: "2026-07-16T11:00:00.000Z" }
        expect((await request("POST", "/rotation-state/listens", event)).status).toBe(201)
        expect((await request("POST", "/rotation-state/listens", event)).status).toBe(201)
        const events = await (await fetch(`${baseUrl}/rotation-state/listens`)).json()
        expect(events).toEqual([event])
        expect(database.prepare("SELECT listen_count FROM albums WHERE id = ?").get(ALBUM_A)).toEqual({ listen_count: 1 })
    })

    it("rejects listening events for unknown Albums", async () => {
        const response = await request("POST", "/rotation-state/listens", {
            id: "550e8400-e29b-41d4-a716-446655440031",
            albumId: "550e8400-e29b-41d4-a716-446655440099",
            listenedAt: "2026-07-16T12:00:00.000Z",
        })
        expect(response.status).toBe(409)
    })

    it("keeps legacy import idempotent but rejects an unrelated server plan", async () => {
        const payload = { active: { ...plan(), focusAlbumId: ALBUM_B }, draft: null, listenEvents: [] }
        expect((await request("POST", "/rotation-state/legacy-import", payload)).status).toBe(200)
        expect((await request("POST", "/rotation-state/legacy-import", payload)).status).toBe(200)

        const unrelated = { ...plan("draft"), id: "550e8400-e29b-41d4-a716-446655440021", name: "Unrelated" }
        expect((await request("PUT", "/rotation-state/plan", unrelated)).status).toBe(200)
        expect((await request("POST", "/rotation-state/legacy-import", payload)).status).toBe(409)
    })
})
