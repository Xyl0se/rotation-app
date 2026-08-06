import { describe, expect, it } from "vitest"
import type { Album } from "../domain/albumTypes.js"
import { toRotationCandidate } from "./rotationDomain.js"

function makeAlbum(partial: Partial<Album> = {}): Album {
    return {
        id: "test-album-1",
        title: "Test Album",
        artist: "Test Artist",
        year: "2024",
        category: "new",
        roleHistory: [],
        listenCount: 0,
        lastListened: null,
        ...partial,
    }
}

describe("toRotationCandidate", () => {
    it("maps a server Album to RotationCandidate", () => {
        const album = makeAlbum({
            id: "a1",
            title: "Dark Side",
            artist: "Pink Floyd",
            category: "classic",
            listenCount: 5,
            lastListened: "2024-01-01T00:00:00Z",
        })
        const candidate = toRotationCandidate(album)
        expect(candidate).toEqual({
            id: "a1",
            title: "Dark Side",
            category: "classic",
            listenCount: 5,
            lastListened: "2024-01-01T00:00:00Z",
        })
    })

    it("excludes archive albums by returning null", () => {
        const album = makeAlbum({ category: "archive" })
        expect(toRotationCandidate(album)).toBeNull()
    })

    it("excludes admire albums by returning null", () => {
        const album = makeAlbum({ category: "admire" })
        expect(toRotationCandidate(album)).toBeNull()
    })

    it("excludes albums without category", () => {
        const album = makeAlbum({ category: undefined })
        expect(toRotationCandidate(album)).toBeNull()
    })

    it("handles null lastListened", () => {
        const album = makeAlbum({
            lastListened: null,
            listenCount: 7,
        })
        const candidate = toRotationCandidate(album)!
        expect(candidate.lastListened).toBeNull()
        expect(candidate.listenCount).toBe(7)
    })

    it("includes all eligible roles", () => {
        const eligibleRoles = ["new", "growing", "comfort-food", "classic"] as const
        for (const role of eligibleRoles) {
            const album = makeAlbum({ category: role })
            expect(toRotationCandidate(album)).not.toBeNull()
        }
    })
})