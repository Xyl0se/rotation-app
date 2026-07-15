import { afterAll, beforeAll, describe, expect, it } from "vitest"
import express from "express"
import type { Server } from "node:http"
import type { AddressInfo } from "node:net"
import type Database from "better-sqlite3"
import { initDatabase } from "../infrastructure/persistence/sqlite/connection.js"
import { createAlbumRepository } from "../infrastructure/persistence/sqlite/albumRepository.js"
import { createAlbumsRouter } from "./albums.js"
import { createRequireWriteTokenForMutations } from "./middleware/writeToken.js"

const TOKEN = "album-integration-token"
const ALBUM_ID = "550e8400-e29b-41d4-a716-446655440000"

describe("album identity contract", () => {
    let database: Database.Database
    let server: Server
    let baseUrl: string

    beforeAll(async () => {
        database = initDatabase(":memory:")
        const app = express()
        app.use(express.json())
        app.use(
            "/albums",
            createRequireWriteTokenForMutations(TOKEN),
            createAlbumsRouter(createAlbumRepository(database)),
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

    it("rejects a conflicting create with the same ID", async () => {
        const response = await write("POST", "/albums", { ...album, title: "Collision" })

        expect(response.status).toBe(409)
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
