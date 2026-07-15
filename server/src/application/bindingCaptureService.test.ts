import { describe, expect, it } from "vitest"
import { initDatabase } from "../infrastructure/persistence/sqlite/connection.js"
import { createAlbumRepository } from "../infrastructure/persistence/sqlite/albumRepository.js"
import { createBindingRepository } from "../infrastructure/persistence/sqlite/bindingRepository.js"
import { createBindingCaptureService } from "./bindingCaptureService.js"

const ALBUM_ID = "762afc5e-5408-4d9d-b48a-237874d7ec34"

function album(title = "Captured") {
    return {
        id: ALBUM_ID,
        title,
        artist: "Artist",
        year: "",
        roleHistory: [],
        listenCount: 0,
        lastListened: null,
    }
}

describe("BindingCaptureService", () => {
    it("creates and links atomically and accepts an idempotent retry", () => {
        const db = initDatabase(":memory:")
        const albums = createAlbumRepository(db)
        const bindings = createBindingRepository(db)
        bindings.upsertProposed("Artist/Captured", "Artist/Captured", new Date().toISOString())
        const service = createBindingCaptureService(db, albums, bindings)

        service.capture("Artist/Captured", album())
        service.capture("Artist/Captured", album())

        expect(albums.findAll()).toHaveLength(1)
        expect(bindings.findById("Artist/Captured")?.library_album_id).toBe(ALBUM_ID)
        db.close()
    })

    it("rolls back Album creation when the Binding cannot be linked", () => {
        const db = initDatabase(":memory:")
        const albums = createAlbumRepository(db)
        const bindings = createBindingRepository(db)
        const service = createBindingCaptureService(db, albums, bindings)

        expect(() => service.capture("missing", album())).toThrow("BINDING_NOT_FOUND")
        expect(albums.findById(ALBUM_ID)).toBeUndefined()
        db.close()
    })
})
