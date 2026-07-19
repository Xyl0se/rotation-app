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

    it("replaces normalized source records transactionally", () => {
        const db = initDatabase(":memory:")
        const repository = createAlbumRepository(db)
        const album = {
            id: "11111111-1111-4111-8111-111111111112", title: "Sources", artist: "Artist", year: "2026",
            roleHistory: [], listenCount: 0, lastListened: null,
            sources: [{ provider: "musicbrainz" as const, externalId: "123e4567-e89b-42d3-a456-426614174000", url: "https://musicbrainz.org/release/123e4567-e89b-42d3-a456-426614174000", resolutionStatus: "resolved" as const, resolvedAt: "2026-07-20T20:00:00.000Z", confirmedByUser: false }],
        }
        repository.save(album)
        expect(repository.findById(album.id)?.sources).toEqual(album.sources)
        repository.save({ ...album, sources: [] })
        expect(repository.findById(album.id)?.sources).toEqual([])
        db.close()
    })
})
