import express from "express"
import type Database from "better-sqlite3"
import type { Server } from "node:http"
import type { AddressInfo } from "node:net"
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { initDatabase } from "../infrastructure/persistence/sqlite/connection.js"
import { createAlbumRepository } from "../infrastructure/persistence/sqlite/albumRepository.js"
import { createRotationStateRepository } from "../infrastructure/persistence/sqlite/rotationStateRepository.js"
import { createRequireWriteTokenForMutations } from "./middleware/writeToken.js"
import { createRotationStateRouter } from "./rotationState.js"
import { createPathGuard } from "../infrastructure/filesystem/pathGuard.js"
import type { BindingRepository } from "../infrastructure/persistence/sqlite/bindingRepository.js"
import { createAuditRepository } from "../infrastructure/persistence/sqlite/auditRepository.js"

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
    let musicRoot: string

    beforeAll(async () => {
        database = initDatabase(":memory:")
        const albums = createAlbumRepository(database)
        for (const [id, title] of [[ALBUM_A, "Alpha"], [ALBUM_B, "Beta"], [OUTSIDER, "Outside"]]) {
            albums.save({ id, title, artist: "Artist", year: "2026", category: id === ALBUM_B ? "growing" : "new", roleHistory: [], listenCount: 0, lastListened: null })
        }
        musicRoot = mkdtempSync(join(tmpdir(), "rotation-handover-"))
        mkdirSync(join(musicRoot, "Artist", "Alpha"), { recursive: true })
        writeFileSync(join(musicRoot, "Artist", "Alpha", "track.mp3"), "audio")
        const bindings = {
            findAll: () => [{
                album_id: "binding-alpha",
                relative_path: "Artist/Alpha",
                state: "confirmed",
                match_source: "manual",
                proposed_at: null,
                confirmed_at: "2026-07-16T10:00:00.000Z",
                library_album_id: ALBUM_A,
            }],
        } as unknown as BindingRepository
        const app = express()
        app.use(express.json())
        app.use("/rotation-state", createRequireWriteTokenForMutations(TOKEN), createRotationStateRouter(
            createRotationStateRepository(database),
            bindings,
            createPathGuard(musicRoot),
            createAuditRepository(database,albums),
        ))
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
        rmSync(musicRoot, { recursive: true, force: true })
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

    it("accepts a draft again after loading its canonical server representation", async () => {
        const draftId = "550e8400-e29b-41d4-a716-446655440021"
        const savedDraft = await request("PUT", "/rotation-state/plan", {
            ...plan("draft"),
            id: draftId,
            acceptedAt: undefined,
        })
        expect(savedDraft.status).toBe(200)

        const loaded = await fetch(`${baseUrl}/rotation-state`).then(response => response.json())
        expect(loaded.draft).toMatchObject({ id: draftId, status: "draft" })
        expect(loaded.draft.acceptedAt).toBeUndefined()
        expect(loaded.draft.archivedAt).toBeUndefined()

        const acceptedAt = "2026-07-16T13:00:00.000Z"
        const accepted = await request("PUT", "/rotation-state/plan", {
            ...loaded.draft,
            status: "active",
            acceptedAt,
        })
        expect(accepted.status).toBe(200)
        await expect(accepted.json()).resolves.toMatchObject({
            id: draftId,
            status: "active",
            acceptedAt,
        })
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

    it("validates and persists journal mutations without putting note text in audit",async()=>{
        const note="Privater Gedanke 🎧"
        const saved=await request("PUT",`/rotation-state/listens/${EVENT_ID}/journal`,{note,moodTags:["curious"],contextTags:["focused"]})
        expect(saved.status).toBe(200);await expect(saved.json()).resolves.toMatchObject({id:EVENT_ID,journal:{note,moodTags:["curious"]}})
        const audit=database.prepare("SELECT before_json,after_json FROM domain_audit_events WHERE event_type='journal-created'").get() as {before_json:string;after_json:string}
        expect(JSON.stringify(audit)).not.toContain(note);expect(audit.after_json).toContain('"noteLength":')
        expect((await request("PUT",`/rotation-state/listens/${EVENT_ID}/journal`,{note:"x",moodTags:["invalid"],contextTags:[]})).status).toBe(400)
        expect((await request("DELETE",`/rotation-state/listens/${EVENT_ID}/journal`)).status).toBe(204)
        const events=await (await fetch(`${baseUrl}/rotation-state/listens`)).json() as Array<{id:string;journal?:unknown}>
        expect(events.find(event=>event.id===EVENT_ID)?.journal).toBeUndefined()
    })

    it("bounds and paginates listening history newest first", async () => {
        const newer = { id: "550e8400-e29b-41d4-a716-446655440032", albumId: ALBUM_B, listenedAt: "2026-07-16T12:00:00.000Z" }
        expect((await request("POST", "/rotation-state/listens", newer)).status).toBe(201)
        const firstPage = await (await fetch(`${baseUrl}/rotation-state/listens?limit=1`)).json()
        const secondPage = await (await fetch(`${baseUrl}/rotation-state/listens?limit=1&offset=1`)).json()
        expect(firstPage).toEqual([newer])
        expect(secondPage).toEqual([expect.objectContaining({ id: EVENT_ID })])
    })

    it("rejects listening events for unknown Albums", async () => {
        const response = await request("POST", "/rotation-state/listens", {
            id: "550e8400-e29b-41d4-a716-446655440031",
            albumId: "550e8400-e29b-41d4-a716-446655440099",
            listenedAt: "2026-07-16T12:00:00.000Z",
        })
        expect(response.status).toBe(409)
    })

    it("creates a new draft from immutable archived history", async () => {
        const oldId="550e8400-e29b-41d4-a716-446655440040"
        expect((await request("PUT","/rotation-state/plan",{...plan(),id:oldId,name:"Old"})).status).toBe(200)
        expect((await request("PUT","/rotation-state/plan",{...plan(),id:PLAN_ID,name:"Current"})).status).toBe(200)
        const response=await request("POST",`/rotation-state/history/${oldId}/draft`)
        expect(response.status).toBe(201)
        await expect(response.json()).resolves.toMatchObject({status:"draft",albumIds:[ALBUM_A,ALBUM_B]})
        const history=await (await fetch(`${baseUrl}/rotation-state/history`)).json()
        expect(history.items).toEqual(expect.arrayContaining([expect.objectContaining({id:oldId,status:"archived"})]))
    })

    it("previews a localized-safe handover contract without requiring a write token", async () => {
        const response = await fetch(`${baseUrl}/rotation-state/handover`)
        expect(response.status).toBe(200)
        const preview = await response.json()
        expect(preview).toMatchObject({
            draftId: expect.any(String),
            activeId: PLAN_ID,
            entering: [],
            leaving: [],
            unchanged: [ALBUM_A, ALBUM_B],
            beforeRoles: { new: 1, growing: 1 },
            afterRoles: { new: 1, growing: 1 },
            size: 2,
            targetSize: 2,
            missingBindings: [ALBUM_B],
            unconfirmedBindings: [],
            estimatedSizeBytes: 5,
            fileCount: 1,
            exportReady: false,
        })
    })

})
