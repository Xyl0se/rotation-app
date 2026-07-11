import { describe, expect, it } from "vitest"

import { makeAlbum } from "../__tests__/factory"

import { groupByLastListened } from "./groupByLastListened"

describe("groupByLastListened", () => {

    const now = new Date("2026-07-07T12:00:00Z")

    it("returns empty array for empty albums", () => {
        expect(groupByLastListened([], [], now)).toEqual([])
    })

    it("groups albums without listen data as 'never'", () => {
        const albums = [
            makeAlbum({ id: "a1", lastListened: null }),
        ]

        const result = groupByLastListened(albums, [], now)

        expect(result).toHaveLength(1)
        expect(result[0].key).toBe("never")
        expect(result[0].title).toBe("Not Yet Listened")
        expect(result[0].albums).toHaveLength(1)
    })

    it("prefers listenEvents over album.lastListened", () => {
        const albums = [
            makeAlbum({
                id: "a1",
                lastListened: "2020-01-01T00:00:00Z",
            }),
        ]

        const events = [
            { id: "e1", albumId: "a1", listenedAt: "2026-07-06T14:00:00Z" },
        ]

        const result = groupByLastListened(albums, events, now)

        expect(result[0].key).toBe("today")
    })

    it("falls back to album.lastListened when no event exists", () => {
        const albums = [
            makeAlbum({
                id: "a1",
                lastListened: "2026-07-05T10:00:00Z",
            }),
        ]

        const result = groupByLastListened(albums, [], now)

        expect(result[0].key).toBe("thisWeek")
    })

    it("groups multiple albums into correct categories", () => {
        const albums = [
            makeAlbum({ id: "a1", lastListened: "2026-07-06T14:00:00Z" }), // today (22h)
            makeAlbum({ id: "a2", lastListened: "2026-07-05T10:00:00Z" }), // thisWeek (50h)
            makeAlbum({ id: "a3", lastListened: "2026-06-27T10:00:00Z" }), // thisMonth (10d)
            makeAlbum({ id: "a4", lastListened: null }),                    // never
        ]

        const result = groupByLastListened(albums, [], now)

        expect(result).toHaveLength(4)
        expect(result.map(g => g.key)).toEqual([
            "today",
            "thisWeek",
            "thisMonth",
            "never",
        ])
    })

    it("sorts albums within group by recency (newest first)", () => {
        const albums = [
            makeAlbum({ id: "a1", lastListened: "2026-07-06T14:00:00Z" }),
            makeAlbum({ id: "a2", lastListened: "2026-07-06T18:00:00Z" }),
            makeAlbum({ id: "a3", lastListened: "2026-07-06T16:00:00Z" }),
        ]

        const result = groupByLastListened(albums, [], now)

        expect(result[0].albums.map(a => a.id)).toEqual(["a2", "a3", "a1"])
    })

    it("uses most recent event per album when multiple events exist", () => {
        const albums = [
            makeAlbum({ id: "a1", lastListened: "2020-01-01T00:00:00Z" }),
        ]

        const events = [
            { id: "e1", albumId: "a1", listenedAt: "2020-01-01T00:00:00Z" },
            { id: "e2", albumId: "a1", listenedAt: "2026-07-06T14:00:00Z" },
        ]

        const result = groupByLastListened(albums, events, now)

        expect(result[0].key).toBe("today")
    })

    it("sorts with events over album.lastListened", () => {
        const albums = [
            makeAlbum({ id: "a1", lastListened: "2026-07-06T14:00:00Z" }),
            makeAlbum({ id: "a2", lastListened: "2026-07-06T18:00:00Z" }),
        ]

        const events = [
            { id: "e1", albumId: "a1", listenedAt: "2026-07-06T20:00:00Z" },
        ]

        const result = groupByLastListened(albums, events, now)

        // a1 hat Event → 20:00, a2 hat nur lastListened → 18:00
        expect(result[0].albums.map(a => a.id)).toEqual(["a1", "a2"])
    })

})
