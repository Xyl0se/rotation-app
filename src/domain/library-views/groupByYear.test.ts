import { describe, expect, it } from "vitest"

import { makeAlbum } from "../__tests__/factory"

import { groupByYear } from "./groupByYear"

describe("groupByYear", () => {

    it("returns empty array for empty input", () => {

        const result = groupByYear([])

        expect(result).toEqual([])

    })

    it("groups albums by year", () => {

        const albums = [
            makeAlbum({ id: "1", year: "1971" }),
            makeAlbum({ id: "2", year: "1979" }),
            makeAlbum({ id: "3", year: "1971" }),
        ]

        const result = groupByYear(albums)

        expect(result).toHaveLength(2)

        const group1971 = result.find(g => g.key === "1971")
        const group1979 = result.find(g => g.key === "1979")

        expect(group1971?.albums).toHaveLength(2)
        expect(group1979?.albums).toHaveLength(1)

    })

    it("sorts groups descending by year", () => {

        const albums = [
            makeAlbum({ id: "1", year: "1971" }),
            makeAlbum({ id: "2", year: "2024" }),
            makeAlbum({ id: "3", year: "1999" }),
        ]

        const result = groupByYear(albums)

        const titles = result.map(g => g.title)
        expect(titles).toEqual(["2024", "1999", "1971"])

    })

    it("sorts albums within a group by title", () => {

        const albums = [
            makeAlbum({ id: "1", year: "1971", title: "Tago Mago" }),
            makeAlbum({ id: "2", year: "1971", title: "Achtung Baby" }),
            makeAlbum({ id: "3", year: "1971", title: "Sticky Fingers" }),
        ]

        const result = groupByYear(albums)
        const group = result.find(g => g.key === "1971")

        const titles = group?.albums.map(a => a.title)
        expect(titles).toEqual(["Achtung Baby", "Sticky Fingers", "Tago Mago"])

    })

    it("places albums without year into 'unknown' group at the end", () => {

        const albums = [
            makeAlbum({ id: "1", year: "2024" }),
            makeAlbum({ id: "2", year: "" }),
            makeAlbum({ id: "3", year: "1971" }),
        ]

        const result = groupByYear(albums)

        expect(result).toHaveLength(3)
        expect(result[0].title).toBe("2024")
        expect(result[1].title).toBe("1971")
        expect(result[2].title).toBe("Unbekannt")
        expect(result[2].albums).toHaveLength(1)

    })

    it("trims whitespace from year values", () => {

        const albums = [
            makeAlbum({ id: "1", year: "  1971  " }),
            makeAlbum({ id: "2", year: "1971" }),
        ]

        const result = groupByYear(albums)

        expect(result).toHaveLength(1)
        expect(result[0].albums).toHaveLength(2)

    })

    it("handles non-numeric years gracefully", () => {

        const albums = [
            makeAlbum({ id: "1", year: "unbekannt" }),
            makeAlbum({ id: "2", year: "1971" }),
        ]

        const result = groupByYear(albums)

        expect(result).toHaveLength(2)

    })

})
