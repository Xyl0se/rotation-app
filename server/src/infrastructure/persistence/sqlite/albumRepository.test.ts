import { describe, expect, it } from "vitest"
import { initDatabase } from "./connection.js"
import { createAlbumRepository } from "./albumRepository.js"

describe("albumRepository API normalization", () => {
    it("maps a nullable database category to an omitted domain role", () => {
        const db = initDatabase(":memory:")
        const repository = createAlbumRepository(db)
        repository.save({
            id: "11111111-1111-4111-8111-111111111111",
            title: "Roleless",
            artist: "Artist",
            year: "2026",
            roleHistory: [],
            listenCount: 0,
            lastListened: null,
        })

        const album = repository.findById("11111111-1111-4111-8111-111111111111")
        expect(album).toBeDefined()
        expect(album?.category).toBeUndefined()
        expect(Object.prototype.hasOwnProperty.call(JSON.parse(JSON.stringify(album)), "category")).toBe(false)
        db.close()
    })
})
