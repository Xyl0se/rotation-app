import { describe, expect, it, beforeEach } from "vitest"
import { createMemoryStorageAdapter } from "../adapters/memoryStorageAdapter"
import { createAlbumRepository } from "./albumRepository"
import { STORAGE } from "../config/storage"

function makeAlbum(partial: Record<string, unknown> = {}): Record<string, unknown> {
    return {
        id: "a1",
        title: "Album 1",
        artist: "Artist",
        year: "2024",
        roleHistory: [],
        listenCount: 0,
        lastListened: null,
        ...partial,
    }
}

describe("albumRepository", () => {
    let adapter = createMemoryStorageAdapter()

    beforeEach(() => {
        adapter = createMemoryStorageAdapter()
    })

    it("returns empty array when no data", () => {
        const repo = createAlbumRepository(adapter)
        expect(repo.load()).toEqual([])
    })

    it("loads albums from storage", () => {
        const albums = [makeAlbum()]
        adapter.set(STORAGE.LIBRARY, JSON.stringify(albums))
        const repo = createAlbumRepository(adapter)
        expect(repo.load()).toEqual(albums)
    })

    it("returns empty array for invalid JSON", () => {
        adapter.set(STORAGE.LIBRARY, "not-json")
        const repo = createAlbumRepository(adapter)
        expect(repo.load()).toEqual([])
    })

    it("returns empty array when data is not an array", () => {
        adapter.set(STORAGE.LIBRARY, JSON.stringify({ id: "a1" }))
        const repo = createAlbumRepository(adapter)
        expect(repo.load()).toEqual([])
    })

    it("filters out malformed records", () => {
        const albums = [
            makeAlbum({ id: "a1", title: "Valid" }),
            { id: null, title: "Invalid", artist: "Artist" },
            makeAlbum({ id: "a2", title: "Also Valid" }),
        ]
        adapter.set(STORAGE.LIBRARY, JSON.stringify(albums))
        const repo = createAlbumRepository(adapter)
        const loaded = repo.load()
        expect(loaded).toHaveLength(2)
        expect(loaded[0].id).toBe("a1")
        expect(loaded[1].id).toBe("a2")
    })

    it("normalizes missing optional fields", () => {
        const albums = [
            { id: "a1", title: "Album", artist: "Artist" },
        ]
        adapter.set(STORAGE.LIBRARY, JSON.stringify(albums))
        const repo = createAlbumRepository(adapter)
        const loaded = repo.load()
        expect(loaded[0]).toEqual({
            id: "a1",
            title: "Album",
            artist: "Artist",
            year: "",
            roleHistory: [],
            listenCount: 0,
            lastListened: null,
        })
    })

    it("filters out unknown category values", () => {
        const albums = [
            makeAlbum({ id: "a1", category: "comfort-food" }),
            makeAlbum({ id: "a2", category: "not-a-role" }),
        ]
        adapter.set(STORAGE.LIBRARY, JSON.stringify(albums))
        const repo = createAlbumRepository(adapter)
        const loaded = repo.load()
        expect(loaded[0].category).toBe("comfort-food")
        expect(loaded[1].category).toBeUndefined()
    })

    it("filters out invalid coverOverride", () => {
        const albums = [
            makeAlbum({
                id: "a1",
                coverOverride: { type: "custom", albumId: "a1", blobUrl: "blob", fetchedAt: "2024-01-01", source: "upload" },
            }),
            makeAlbum({ id: "a2", coverOverride: { type: "broken" } }),
        ]
        adapter.set(STORAGE.LIBRARY, JSON.stringify(albums))
        const repo = createAlbumRepository(adapter)
        const loaded = repo.load()
        expect(loaded[0].coverOverride).toBeDefined()
        expect(loaded[1].coverOverride).toBeUndefined()
    })

    it("filters out invalid roleHistory entries", () => {
        const albums = [
            makeAlbum({
                id: "a1",
                roleHistory: [
                    { role: "new", recordedAt: "2024-01-01", source: "coach" },
                    { role: "broken" },
                ],
            }),
        ]
        adapter.set(STORAGE.LIBRARY, JSON.stringify(albums))
        const repo = createAlbumRepository(adapter)
        const loaded = repo.load()
        expect(loaded[0].roleHistory).toHaveLength(1)
        expect(loaded[0].roleHistory[0].role).toBe("new")
    })

    it("normalizes invalid listenCount to 0", () => {
        const albums = [
            makeAlbum({ id: "a1", listenCount: -5 }),
            makeAlbum({ id: "a2", listenCount: "five" }),
            makeAlbum({ id: "a3", listenCount: 2.7 }),
        ]
        adapter.set(STORAGE.LIBRARY, JSON.stringify(albums))
        const repo = createAlbumRepository(adapter)
        const loaded = repo.load()
        expect(loaded[0].listenCount).toBe(0)
        expect(loaded[1].listenCount).toBe(0)
        expect(loaded[2].listenCount).toBe(2)
    })

    it("normalizes invalid lastListened to null", () => {
        const albums = [
            makeAlbum({ id: "a1", lastListened: "not-a-date" }),
            makeAlbum({ id: "a2", lastListened: "2024-06-15T10:00:00Z" }),
        ]
        adapter.set(STORAGE.LIBRARY, JSON.stringify(albums))
        const repo = createAlbumRepository(adapter)
        const loaded = repo.load()
        expect(loaded[0].lastListened).toBeNull()
        expect(loaded[1].lastListened).toBe("2024-06-15T10:00:00Z")
    })

    it("normalizes missing story to undefined", () => {
        const albums = [makeAlbum({ id: "a1" })]
        adapter.set(STORAGE.LIBRARY, JSON.stringify(albums))
        const repo = createAlbumRepository(adapter)
        const loaded = repo.load()
        expect(loaded[0].story).toBeUndefined()
    })

    it("loads valid story", () => {
        const albums = [
            makeAlbum({
                id: "a1",
                story: {
                    acquiredBecause: "concert",
                    lifePhase: "studies",
                    memoryNote: "Nach dem Konzert in Berlin",
                    createdAt: "2024-01-01T00:00:00Z",
                    updatedAt: "2024-06-01T00:00:00Z",
                },
            }),
        ]
        adapter.set(STORAGE.LIBRARY, JSON.stringify(albums))
        const repo = createAlbumRepository(adapter)
        const loaded = repo.load()
        expect(loaded[0].story).toEqual({
            acquiredBecause: "concert",
            lifePhase: "studies",
            memoryNote: "Nach dem Konzert in Berlin",
            createdAt: "2024-01-01T00:00:00Z",
            updatedAt: "2024-06-01T00:00:00Z",
        })
    })

    it("filters out invalid story fields", () => {
        const albums = [
            makeAlbum({
                id: "a1",
                story: {
                    acquiredBecause: "not-a-valid-reason",
                    memoryNote: "Notiz",
                    createdAt: "2024-01-01T00:00:00Z",
                    updatedAt: "2024-06-01T00:00:00Z",
                },
            }),
            makeAlbum({
                id: "a2",
                story: {
                    acquiredBecause: "gift",
                    createdAt: "2024-01-01T00:00:00Z",
                    updatedAt: "invalid-date",
                },
            }),
            makeAlbum({
                id: "a3",
                story: "not-an-object",
            }),
        ]
        adapter.set(STORAGE.LIBRARY, JSON.stringify(albums))
        const repo = createAlbumRepository(adapter)
        const loaded = repo.load()
        expect(loaded[0].story).toBeUndefined()
        expect(loaded[1].story).toBeUndefined()
        expect(loaded[2].story).toBeUndefined()
    })

    it("loads story with minimal fields", () => {
        const albums = [
            makeAlbum({
                id: "a1",
                story: {
                    createdAt: "2024-01-01T00:00:00Z",
                    updatedAt: "2024-01-01T00:00:00Z",
                },
            }),
        ]
        adapter.set(STORAGE.LIBRARY, JSON.stringify(albums))
        const repo = createAlbumRepository(adapter)
        const loaded = repo.load()
        expect(loaded[0].story).toEqual({
            createdAt: "2024-01-01T00:00:00Z",
            updatedAt: "2024-01-01T00:00:00Z",
        })
    })

    it("saves albums to storage", () => {
        const repo = createAlbumRepository(adapter)
        const albums = [makeAlbum()]
        repo.save(albums as unknown as import("../types/album").Album[])
        expect(adapter.get(STORAGE.LIBRARY)).toBe(JSON.stringify(albums))
    })

    it("clears albums from storage", () => {
        adapter.set(STORAGE.LIBRARY, "[]")
        const repo = createAlbumRepository(adapter)
        repo.clear()
        expect(adapter.get(STORAGE.LIBRARY)).toBeNull()
    })
})
