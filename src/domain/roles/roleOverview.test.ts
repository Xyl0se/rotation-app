import { describe, expect, it } from "vitest"

import type { Album } from "../../types/album"

import {
    getAlbumsByRole,
    getRoleStats,
    createRoleOverview,
} from "./roleOverview"

function makeAlbum(
    overrides: Partial<Album> = {},
): Album {
    return {
        id: "test-id",
        title: "Test Album",
        artist: "Test Artist",
        year: "2024",
        roleHistory: [],
        listenCount: 0,
        lastListened: null,
        ...overrides,
    }
}

describe("getAlbumsByRole", () => {

    it("returns albums matching the given role", () => {

        const albums: Album[] = [
            makeAlbum({ id: "1", category: "classic" }),
            makeAlbum({ id: "2", category: "new" }),
            makeAlbum({ id: "3", category: "classic" }),
        ]

        const result = getAlbumsByRole(albums, "classic")

        expect(result).toHaveLength(2)
        expect(result.map(a => a.id)).toEqual(["1", "3"])

    })

    it("returns empty array when no albums match", () => {

        const albums: Album[] = [
            makeAlbum({ id: "1", category: "new" }),
        ]

        const result = getAlbumsByRole(albums, "classic")

        expect(result).toEqual([])

    })

    it("returns empty array for empty input", () => {

        const result = getAlbumsByRole([], "new")

        expect(result).toEqual([])

    })

    it("excludes albums without a category", () => {

        const albums: Album[] = [
            makeAlbum({ id: "1", category: undefined }),
            makeAlbum({ id: "2", category: "new" }),
        ]

        const result = getAlbumsByRole(albums, "new")

        expect(result).toHaveLength(1)
        expect(result[0].id).toBe("2")

    })

})

describe("getRoleStats", () => {

    it("returns count and preview albums", () => {

        const albums: Album[] = [
            makeAlbum({ id: "1", category: "classic" }),
            makeAlbum({ id: "2", category: "classic" }),
            makeAlbum({ id: "3", category: "classic" }),
        ]

        const result = getRoleStats(albums, "classic")

        expect(result.albumCount).toBe(3)
        expect(result.previewAlbums).toHaveLength(3)

    })

    it("limits preview albums to maxPreviewCount", () => {

        const albums: Album[] = [
            makeAlbum({ id: "1", category: "new" }),
            makeAlbum({ id: "2", category: "new" }),
            makeAlbum({ id: "3", category: "new" }),
            makeAlbum({ id: "4", category: "new" }),
        ]

        const result = getRoleStats(albums, "new", 2)

        expect(result.albumCount).toBe(4)
        expect(result.previewAlbums).toHaveLength(2)

    })

    it("defaults maxPreviewCount to 3", () => {

        const albums: Album[] = Array.from(
            { length: 5 },
            (_, i) => makeAlbum({
                id: String(i + 1),
                category: "growing",
            }),
        )

        const result = getRoleStats(albums, "growing")

        expect(result.previewAlbums).toHaveLength(3)

    })

    it("returns zero counts for empty role", () => {

        const result = getRoleStats([], "archive")

        expect(result.albumCount).toBe(0)
        expect(result.previewAlbums).toEqual([])

    })

})

describe("createRoleOverview", () => {

    it("returns an overview for every defined role", () => {

        const result = createRoleOverview([])

        expect(result).toHaveLength(6)

        const ids = result.map(r => r.role.id)

        expect(ids).toEqual([
            "new",
            "growing",
            "comfort-food",
            "classic",
            "admire",
            "archive",
        ])

    })

    it("marks roles without albums as empty", () => {

        const albums: Album[] = [
            makeAlbum({ id: "1", category: "classic" }),
        ]

        const result = createRoleOverview(albums)

        const classic = result.find(r => r.role.id === "classic")
        const newRole = result.find(r => r.role.id === "new")

        expect(classic?.isEmpty).toBe(false)
        expect(classic?.albumCount).toBe(1)

        expect(newRole?.isEmpty).toBe(true)
        expect(newRole?.albumCount).toBe(0)

    })

    it("includes preview albums in each overview", () => {

        const albums: Album[] = [
            makeAlbum({ id: "1", category: "comfort-food" }),
            makeAlbum({ id: "2", category: "comfort-food" }),
        ]

        const result = createRoleOverview(albums)

        const comfort = result.find(
            r => r.role.id === "comfort-food",
        )

        expect(comfort?.previewAlbums).toHaveLength(2)
        expect(
            comfort?.previewAlbums.map(a => a.id),
        ).toEqual(["1", "2"])

    })

    it("does not hardcode role count", () => {

        const result = createRoleOverview([])

        expect(result.length).toBeGreaterThan(0)

    })

})
