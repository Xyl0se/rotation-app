import { describe, expect, it } from "vitest"

import { makeAlbum } from "../__tests__/factory"

import { groupByRoleChange } from "./groupByRoleChange"

describe("groupByRoleChange", () => {

    const now = new Date("2026-07-07T12:00:00Z")

    it("returns empty array for empty albums", () => {
        expect(groupByRoleChange([], now)).toEqual([])
    })

    it("groups albums without roleHistory as 'never'", () => {
        const albums = [
            makeAlbum({ id: "a1", roleHistory: [] }),
        ]

        const result = groupByRoleChange(albums, now)

        expect(result).toHaveLength(1)
        expect(result[0].key).toBe("never")
        expect(result[0].title).toBe("No classification yet")
        expect(result[0].albums).toHaveLength(1)
    })

    it("groups albums by most recent roleHistory entry", () => {
        const albums = [
            makeAlbum({
                id: "a1",
                roleHistory: [
                    { role: "classic", recordedAt: "2026-07-06T14:00:00Z", source: "coach" },
                ],
            }),
            makeAlbum({
                id: "a2",
                roleHistory: [
                    { role: "growing", recordedAt: "2026-07-05T10:00:00Z", source: "coach" },
                ],
            }),
        ]

        const result = groupByRoleChange(albums, now)

        expect(result).toHaveLength(2)
        expect(result[0].key).toBe("today")
        expect(result[0].albums).toHaveLength(1)
        expect(result[1].key).toBe("thisWeek")
        expect(result[1].albums).toHaveLength(1)
    })

    it("uses most recent entry when multiple history entries exist", () => {
        const albums = [
            makeAlbum({
                id: "a1",
                roleHistory: [
                    { role: "classic", recordedAt: "2020-01-01T00:00:00Z", source: "coach" },
                    { role: "growing", recordedAt: "2026-07-06T14:00:00Z", source: "reflection" },
                ],
            }),
        ]

        const result = groupByRoleChange(albums, now)

        expect(result[0].key).toBe("today")
    })

    it("sorts albums within group by most recent roleHistory", () => {
        const albums = [
            makeAlbum({
                id: "a1",
                roleHistory: [
                    { role: "classic", recordedAt: "2026-07-06T14:00:00Z", source: "coach" },
                ],
            }),
            makeAlbum({
                id: "a2",
                roleHistory: [
                    { role: "growing", recordedAt: "2026-07-06T18:00:00Z", source: "coach" },
                ],
            }),
            makeAlbum({
                id: "a3",
                roleHistory: [
                    { role: "comfort-food", recordedAt: "2026-07-06T16:00:00Z", source: "coach" },
                ],
            }),
        ]

        const result = groupByRoleChange(albums, now)

        expect(result[0].albums.map(a => a.id)).toEqual(["a2", "a3", "a1"])
    })

    it("groups albums across multiple categories", () => {
        const albums = [
            makeAlbum({
                id: "a1",
                roleHistory: [
                    { role: "classic", recordedAt: "2026-07-06T14:00:00Z", source: "coach" },
                ],
            }),
            makeAlbum({
                id: "a2",
                roleHistory: [
                    { role: "growing", recordedAt: "2026-06-27T10:00:00Z", source: "coach" },
                ],
            }),
            makeAlbum({
                id: "a3",
                roleHistory: [],
            }),
        ]

        const result = groupByRoleChange(albums, now)

        expect(result).toHaveLength(3)
        expect(result.map(g => g.key)).toEqual([
            "today",
            "thisMonth",
            "never",
        ])
    })

    it("only includes groups that have albums", () => {
        const albums = [
            makeAlbum({
                id: "a1",
                roleHistory: [
                    { role: "classic", recordedAt: "2026-07-06T14:00:00Z", source: "coach" },
                ],
            }),
        ]

        const result = groupByRoleChange(albums, now)

        expect(result).toHaveLength(1)
        expect(result[0].key).toBe("today")
    })

})
