import { afterAll, beforeAll, describe, expect, it, vi } from "vitest"
import express from "express"
import type { Server } from "node:http"
import type { AddressInfo } from "node:net"
import type Database from "better-sqlite3"
import { initDatabase } from "../infrastructure/persistence/sqlite/connection.js"
import { createAlbumRepository } from "../infrastructure/persistence/sqlite/albumRepository.js"
import { createAlbumsRouter } from "./albums.js"
import { createRequireWriteTokenForMutations } from "./middleware/writeToken.js"
import type { AlbumSource } from "../domain/albumTypes.js"

const TOKEN = "album-integration-token"
const ALBUM_ID = "550e8400-e29b-41d4-a716-446655440000"
const UNICODE_EDGE_TITLE = "Vįr+üål Åįrßñß & h º r ¡ z º n щ ¡ r e l e s s - E м e я a l d D į ѵ e"

describe("album identity contract", () => {
    let database: Database.Database
    let server: Server
    let baseUrl: string
    const onCreatedAlbum = vi.fn()
    const resolveExternalSources = vi.fn<(releaseId: string, releaseGroupId?: string) => Promise<AlbumSource[]>>(async () => [])
    const searchMusicBrainzReleases = vi.fn(async () => [{ releaseId: "123e4567-e89b-42d3-a456-426614174020", title: "Album", artist: "Artist", year: "2024" }])

    beforeAll(async () => {
        database = initDatabase(":memory:")
        const app = express()
        app.use(express.json())
        app.use(
            "/albums",
            createRequireWriteTokenForMutations(TOKEN),
            createAlbumsRouter(createAlbumRepository(database), undefined, undefined, onCreatedAlbum, resolveExternalSources, searchMusicBrainzReleases),
        )
        await new Promise<void>((resolve, reject) => {
            server = app.listen(0, "127.0.0.1", () => {
                const address = server.address() as AddressInfo
                baseUrl = `http://127.0.0.1:${address.port}`
                resolve()
            })
            server.on("error", reject)
        })
    })

    afterAll(async () => {
        await new Promise<void>((resolve, reject) => {
            server.close((error) => error ? reject(error) : resolve())
        })
        database.close()
    })

    async function write(method: "POST" | "PUT" | "DELETE", path: string, body?: unknown) {
        return fetch(`${baseUrl}${path}`, {
            method,
            headers: {
                "content-type": "application/json",
                "x-rotation-write-token": TOKEN,
            },
            body: body === undefined ? undefined : JSON.stringify(body),
        })
    }

    const album = {
        id: ALBUM_ID,
        title: "Album",
        artist: "Artist",
        year: "2024",
        roleHistory: [],
        listenCount: 0,
        lastListened: null,
    }

    it("preserves the client-generated ID during create", async () => {
        const response = await write("POST", "/albums", album)

        expect(response.status).toBe(201)
        await expect(response.json()).resolves.toMatchObject({ id: ALBUM_ID })
    })

    it("treats an equivalent repeated create as idempotent", async () => {
        const response = await write("POST", "/albums", album)

        expect(response.status).toBe(200)
        await expect(response.json()).resolves.toMatchObject({ id: ALBUM_ID, title: "Album" })
    })

    it("queues bounded remote candidates only after the Album exists", async () => {
        const id = "550e8400-e29b-41d4-a716-446655440004"
        const coverCandidates = [
            "https://coverartarchive.org/release/one/front",
            "https://coverartarchive.org/release-group/two/front",
        ]
        const response = await write("POST", "/albums", { ...album, id, coverCandidates })

        expect(response.status).toBe(201)
        expect(onCreatedAlbum).toHaveBeenCalledWith(id, coverCandidates)
    })

    it("stores resolved relationships while keeping capture successful when enrichment fails", async () => {
        const releaseId = "123e4567-e89b-42d3-a456-426614174010"
        const releaseGroupId = "123e4567-e89b-42d3-a456-426614174012"
        const musicBrainz = { provider: "musicbrainz", externalId: releaseId, url: `https://musicbrainz.org/release/${releaseId}`, resolutionStatus: "resolved", resolvedAt: "2026-07-20T20:00:00.000Z", confirmedByUser: false }
        const musicBrainzGroup = { ...musicBrainz, externalId: releaseGroupId, url: `https://musicbrainz.org/release-group/${releaseGroupId}` }
        resolveExternalSources.mockResolvedValueOnce([{ provider: "wikipedia", externalId: "Album", url: "https://de.wikipedia.org/wiki/Album", locale: "de", resolutionStatus: "resolved", resolvedAt: "2026-07-20T20:01:00.000Z", confirmedByUser: false }])
        const enriched = await write("POST", "/albums", { ...album, id: "550e8400-e29b-41d4-a716-446655440010", sources: [musicBrainz, musicBrainzGroup] })
        expect(enriched.status).toBe(201)
        expect((await enriched.json()).sources).toHaveLength(3)
        expect(resolveExternalSources).toHaveBeenCalledWith(releaseId, releaseGroupId)

        resolveExternalSources.mockRejectedValueOnce(new Error("provider timeout"))
        const resilient = await write("POST", "/albums", { ...album, id: "550e8400-e29b-41d4-a716-446655440011", sources: [musicBrainz] })
        expect(resilient.status).toBe(201)
        expect((await resilient.json()).sources).toEqual([musicBrainz])
    })

    it("rejects a conflicting create with the same ID", async () => {
        const response = await write("POST", "/albums", { ...album, title: "Collision" })

        expect(response.status).toBe(409)
    })

    it("preserves a mixed-script and diacritic-heavy title byte-for-byte", async () => {
        const id = "550e8400-e29b-41d4-a716-446655440003"
        const created = await write("POST", "/albums", { ...album, id, title: UNICODE_EDGE_TITLE })
        expect(created.status).toBe(201)
        await expect(created.json()).resolves.toMatchObject({ id, title: UNICODE_EDGE_TITLE })

        const read = await fetch(`${baseUrl}/albums/${id}`)
        expect(read.status).toBe(200)
        await expect(read.json()).resolves.toMatchObject({ title: UNICODE_EDGE_TITLE })
        expect((database.prepare("SELECT title FROM albums WHERE id = ?").get(id) as { title:string }).title).toBe(UNICODE_EDGE_TITLE)
    })

    it("rolls back the complete import batch when one database write fails", async () => {
        const firstId = "550e8400-e29b-41d4-a716-446655440001"
        const secondId = "550e8400-e29b-41d4-a716-446655440002"
        database.exec(`
            CREATE TRIGGER fail_second_album
            BEFORE INSERT ON albums
            WHEN NEW.id = '${secondId}'
            BEGIN
                SELECT RAISE(ABORT, 'simulated write failure');
            END;
        `)
        const response = await write("POST", "/albums/import", {
            albums: [
                { ...album, id: firstId },
                { ...album, id: secondId },
            ],
        })

        expect(response.status).toBe(500)
        expect((await fetch(`${baseUrl}/albums/${firstId}`)).status).toBe(404)
        expect((await fetch(`${baseUrl}/albums/${secondId}`)).status).toBe(404)
        database.exec("DROP TRIGGER fail_second_album")
    })

    it("persists Archive reasons while rejecting them on non-Archive roles",async()=>{
        const archived=await write("PUT",`/albums/${ALBUM_ID}`,{category:"archive",roleHistory:[{role:"archive",recordedAt:"2026-07-18T08:00:00.000Z",source:"coach",archiveReason:"canonical-but-not-personal"}]})
        expect(archived.status).toBe(200);expect((await archived.json()).roleHistory[0].archiveReason).toBe("canonical-but-not-personal")
        const invalid=await write("PUT",`/albums/${ALBUM_ID}`,{category:"classic",roleHistory:[{role:"classic",recordedAt:"2026-07-18T08:00:00.000Z",source:"coach",archiveReason:"no-connection"}]})
        expect(invalid.status).toBe(400)
    })

    it("persists stable MusicBrainz identities independently from editable metadata", async () => {
        const releaseId = "123e4567-e89b-42d3-a456-426614174000"
        const source = {
            provider: "musicbrainz",
            externalId: releaseId,
            url: `https://musicbrainz.org/release/${releaseId}`,
            resolutionStatus: "resolved",
            resolvedAt: "2026-07-20T20:00:00.000Z",
            confirmedByUser: false,
        }
        const update = await write("PUT", `/albums/${ALBUM_ID}/sources`, { sources: [source] })
        expect(update.status).toBe(200)
        await expect(update.json()).resolves.toMatchObject({ sources: [{ ...source, confirmedByUser: true }] })

        const rename = await write("PUT", `/albums/${ALBUM_ID}`, { title: "Renamed Album" })
        expect(rename.status).toBe(200)
        await expect(rename.json()).resolves.toMatchObject({ title: "Renamed Album", sources: [{ ...source, confirmedByUser: true }] })
    })

    it("rejects unsafe or provider-inconsistent source records", async () => {
        const externalId = "123e4567-e89b-42d3-a456-426614174001"
        const base = { provider: "musicbrainz", externalId, resolutionStatus: "resolved", resolvedAt: "2026-07-20T20:00:00.000Z", confirmedByUser: false }
        expect((await write("PUT", `/albums/${ALBUM_ID}/sources`, { sources: [{ ...base, url: `http://musicbrainz.org/release/${externalId}` }] })).status).toBe(400)
        expect((await write("PUT", `/albums/${ALBUM_ID}/sources`, { sources: [{ ...base, url: `https://evil.example/release/${externalId}` }] })).status).toBe(400)
        expect((await write("PUT", `/albums/${ALBUM_ID}/sources`, { sources: [{ ...base, externalId: "not-an-id", url: "https://musicbrainz.org/release/not-an-id" }] })).status).toBe(400)
    })

    it("keeps confirmed sources unchanged until an explicit reviewed save", async () => {
        const existing = (await (await fetch(`${baseUrl}/albums/${ALBUM_ID}`)).json()).sources as AlbumSource[]
        const confirmed = await write("PUT", `/albums/${ALBUM_ID}/sources`, { sources: existing })
        expect(confirmed.status).toBe(200)
        expect((await confirmed.json()).sources.every((source: AlbumSource) => source.confirmedByUser)).toBe(true)

        expect((await write("POST", `/albums/${ALBUM_ID}/sources/search`)).status).toBe(200)
        const previewReleaseId = "123e4567-e89b-42d3-a456-426614174020"
        const previewGroupId = "123e4567-e89b-42d3-a456-426614174021"
        expect((await write("POST", `/albums/${ALBUM_ID}/sources/preview`, { releaseId: previewReleaseId, releaseGroupId: previewGroupId })).status).toBe(200)
        expect(resolveExternalSources).toHaveBeenCalledWith(previewReleaseId, previewGroupId)
        const attemptedSilentReplacement = await write("PUT", `/albums/${ALBUM_ID}`, { sources: [] })
        expect((await attemptedSilentReplacement.json()).sources).toHaveLength(existing.length)

        const corrected = existing.map(source => source.provider === "musicbrainz" ? { ...source, url: source.url?.replace("/release/", "/release-group/") } : source)
        const saved = await write("PUT", `/albums/${ALBUM_ID}/sources`, { sources: corrected })
        expect(saved.status).toBe(200)
        expect((await saved.json()).sources[0].confirmedByUser).toBe(true)
        const removed = await write("PUT", `/albums/${ALBUM_ID}/sources`, { sources: [] })
        expect(removed.status).toBe(200)
        expect((await removed.json()).sources).toEqual([])
    })

    it("updates and deletes the same canonical ID", async () => {
        const createdAt = (database.prepare("SELECT created_at FROM albums WHERE id = ?").get(ALBUM_ID) as { created_at: string }).created_at
        const update = await write("PUT", `/albums/${ALBUM_ID}`, { ...album, title: "Updated" })
        expect(update.status).toBe(200)
        await expect(update.json()).resolves.toMatchObject({ id: ALBUM_ID, title: "Updated" })
        expect((database.prepare("SELECT created_at FROM albums WHERE id = ?").get(ALBUM_ID) as { created_at: string }).created_at).toBe(createdAt)

        const deletion = await write("DELETE", `/albums/${ALBUM_ID}`)
        expect(deletion.status).toBe(204)

        const read = await fetch(`${baseUrl}/albums/${ALBUM_ID}`)
        expect(read.status).toBe(404)
    })
})
