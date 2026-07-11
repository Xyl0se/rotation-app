import { describe, expect, it } from "vitest"

import { makeAlbum } from "../__tests__/factory"

import { groupByArtist } from "./groupByArtist"

describe("groupByArtist", () => {

    it("returns empty array for empty input", () => {

        const result = groupByArtist([])

        expect(result).toEqual([])

    })

    it("groups albums by artist", () => {

        const albums = [
            makeAlbum({ id: "1", artist: "Kraftwerk", title: "Autobahn" }),
            makeAlbum({ id: "2", artist: "Can", title: "Tago Mago" }),
            makeAlbum({ id: "3", artist: "Kraftwerk", title: "Die Mensch-Maschine" }),
        ]

        const result = groupByArtist(albums)

        expect(result).toHaveLength(2)

        const canGroup = result.find(g => g.key === "Can")
        const kraftwerkGroup = result.find(g => g.key === "Kraftwerk")

        expect(canGroup?.albums).toHaveLength(1)
        expect(canGroup?.albums[0].id).toBe("2")

        expect(kraftwerkGroup?.albums).toHaveLength(2)
        expect(kraftwerkGroup?.albums.map(a => a.id)).toEqual(["1", "3"])

    })

    it("sorts groups alphabetically", () => {

        const albums = [
            makeAlbum({ id: "1", artist: "Zappa" }),
            makeAlbum({ id: "2", artist: "Autechre" }),
            makeAlbum({ id: "3", artist: "Miles Davis" }),
        ]

        const result = groupByArtist(albums)

        const titles = result.map(g => g.title)
        expect(titles).toEqual(["Autechre", "Miles Davis", "Zappa"])

    })

    it("sorts albums within a group by title", () => {

        const albums = [
            makeAlbum({ id: "1", artist: "Radiohead", title: "Kid A" }),
            makeAlbum({ id: "2", artist: "Radiohead", title: "Amnesiac" }),
            makeAlbum({ id: "3", artist: "Radiohead", title: "OK Computer" }),
        ]

        const result = groupByArtist(albums)
        const group = result.find(g => g.key === "Radiohead")

        const titles = group?.albums.map(a => a.title)
        expect(titles).toEqual(["Amnesiac", "Kid A", "OK Computer"])

    })

    it("places albums without artist into 'unknown' group at the end", () => {

        const albums = [
            makeAlbum({ id: "1", artist: "Autechre" }),
            makeAlbum({ id: "2", artist: "" }),
            makeAlbum({ id: "3", artist: "Zappa" }),
        ]

        const result = groupByArtist(albums)

        expect(result).toHaveLength(3)
        expect(result[0].title).toBe("Autechre")
        expect(result[1].title).toBe("Zappa")
        expect(result[2].title).toBe("Unknown")
        expect(result[2].albums).toHaveLength(1)

    })

    it("trims whitespace from artist names", () => {

        const albums = [
            makeAlbum({ id: "1", artist: "  Kraftwerk  " }),
            makeAlbum({ id: "2", artist: "Kraftwerk" }),
        ]

        const result = groupByArtist(albums)

        expect(result).toHaveLength(1)
        expect(result[0].albums).toHaveLength(2)

    })

})
