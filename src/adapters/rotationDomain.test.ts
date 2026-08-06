import { describe, expect, it } from "vitest"
import { makeAlbum } from "../domain/__tests__/factory"
import { toRotationCandidate } from "./rotationDomain"

describe("toRotationCandidate", () => {
    it("maps a client Album to RotationCandidate", () => {
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

    it("preserves listenCount and lastListened", () => {
        const album = makeAlbum({
            listenCount: 42,
            lastListened: null,
        })
        const candidate = toRotationCandidate(album)!
        expect(candidate.listenCount).toBe(42)
        expect(candidate.lastListened).toBeNull()
    })

    it("includes all eligible roles", () => {
        const eligibleRoles = ["new", "growing", "comfort-food", "classic"] as const
        for (const role of eligibleRoles) {
            const album = makeAlbum({ category: role })
            expect(toRotationCandidate(album)).not.toBeNull()
        }
    })
})