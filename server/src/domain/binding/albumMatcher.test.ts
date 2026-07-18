import { describe, it, expect } from "vitest"
import { matchAlbumToFolder, rankBindingCandidates, suggestBindings } from "./albumMatcher.js"

const UNICODE_EDGE_TITLE = "Vįr+üål Åįrßñß & h º r ¡ z º n щ ¡ r e l e s s - E м e я a l d D į ѵ e"

const candidates = [
    { albumId: "1", relativePath: "Pink Floyd/The Dark Side of the Moon", artistName: "Pink Floyd", albumName: "The Dark Side of the Moon" },
    { albumId: "2", relativePath: "Radiohead/OK Computer", artistName: "Radiohead", albumName: "OK Computer" },
    { albumId: "3", relativePath: "The Beatles/Abbey Road", artistName: "The Beatles", albumName: "Abbey Road" },
]

describe("matchAlbumToFolder", () => {
    it("finds exact match", () => {
        const result = matchAlbumToFolder("a", "The Dark Side of the Moon", "Pink Floyd", candidates)
        expect(result).not.toBeNull()
        expect(result!.source).toBe("exact")
        expect(result!.score).toBe(1.0)
        expect(result!.relativePath).toBe("Pink Floyd/The Dark Side of the Moon")
        expect(result!.libraryAlbumId).toBe("a")
    })

    it("finds case-insensitive match", () => {
        const result = matchAlbumToFolder("b", "ok computer", "radiohead", candidates)
        expect(result).not.toBeNull()
        expect(result!.source).toBe("case-insensitive")
        expect(result!.score).toBe(0.95)
        expect(result!.libraryAlbumId).toBe("b")
    })

    it("finds normalized match (ignores punctuation)", () => {
        const result = matchAlbumToFolder("c", "Abbey Road", "The Beatles!", candidates)
        expect(result).not.toBeNull()
        expect(result!.source).toBe("normalized")
        expect(result!.score).toBe(0.9)
        expect(result!.libraryAlbumId).toBe("c")
    })

    it("returns null when no match", () => {
        const result = matchAlbumToFolder("d", "Unknown Album", "Unknown Artist", candidates)
        expect(result).toBeNull()
    })

    it("matches without artist (title only)", () => {
        const single = [{ albumId: "x", relativePath: "Abbey Road", artistName: "", albumName: "Abbey Road" }]
        const result = matchAlbumToFolder("e", "Abbey Road", undefined, single)
        expect(result).not.toBeNull()
        expect(result!.source).toBe("exact")
        expect(result!.libraryAlbumId).toBe("e")
    })

    it("matches canonically equivalent filesystem Unicode without losing mixed scripts", () => {
        const decomposedTitle = UNICODE_EDGE_TITLE.normalize("NFD")
        const result = matchAlbumToFolder("unicode", UNICODE_EDGE_TITLE, "Edge Artist", [{
            albumId:"unicode-folder",relativePath:`Edge Artist/${decomposedTitle}`,artistName:"Edge Artist",albumName:decomposedTitle,
        }])
        expect(result).toMatchObject({libraryAlbumId:"unicode",candidateAlbumId:"unicode-folder",source:"normalized",score:.9})
    })
})

describe("suggestBindings", () => {
    it("suggests matches for multiple albums", () => {
        const library = [
            { id: "a", title: "The Dark Side of the Moon", artist: "Pink Floyd" },
            { id: "b", title: "OK Computer", artist: "Radiohead" },
            { id: "c", title: "Unknown", artist: "Nobody" },
        ]
        const results = suggestBindings(library, candidates)
        expect(results).toHaveLength(2)
        expect(results.map((r) => r.libraryAlbumId)).toContain("a")
        expect(results.map((r) => r.libraryAlbumId)).toContain("b")
    })

    it("never assigns the same folder twice", () => {
        const library = [
            { id: "a", title: "The Dark Side of the Moon", artist: "Pink Floyd" },
            { id: "b", title: "The Dark Side of the Moon", artist: "Pink Floyd" },
        ]
        const results = suggestBindings(library, candidates)
        expect(results).toHaveLength(1)
    })
})

describe("rankBindingCandidates", () => {
    it("ranks Unicode-safe title and artist matches", () => {
        const result = rankBindingCandidates(
            { albumName: "Ki", artistName: "喜多郎" },
            [
                { id: "a", title: "Ki", artist: "喜多郎" },
                { id: "b", title: "Silk Road", artist: "喜多郎" },
            ],
        )
        expect(result[0]).toMatchObject({ libraryAlbumId: "a", confidence: "strong" })
        expect(result[0]?.reasons).toContain("artist-exact")
    })

    it("ranks the complete mixed-script edge title as the exact normalized candidate", () => {
        const result=rankBindingCandidates({albumName:UNICODE_EDGE_TITLE.normalize("NFD"),artistName:"Edge Artist"},[
            {id:"edge",title:UNICODE_EDGE_TITLE,artist:"Edge Artist"},
            {id:"plain",title:"Emerald Dive",artist:"Edge Artist"},
        ])
        expect(result[0]).toMatchObject({libraryAlbumId:"edge",confidence:"strong"})
        expect(result[0]?.reasons).toContain("title-exact")
    })

    it("penalizes conflicting volume numbers", () => {
        const result = rankBindingCandidates(
            { albumName: "Cafe del Mar Volume 10", artistName: "Various Artists" },
            [
                { id: "eight", title: "Cafe del Mar Volume 8", artist: "Various Artists" },
                { id: "ten", title: "Cafe del Mar Volume 10", artist: "Various Artists" },
            ],
        )
        expect(result[0]?.libraryAlbumId).toBe("ten")
        expect(result.find(candidate => candidate.libraryAlbumId === "eight")?.reasons).toContain("volume-conflict")
    })

    it("returns no candidate for unrelated metadata", () => {
        expect(rankBindingCandidates(
            { albumName: "Unknown", artistName: "Nobody" },
            [{ id: "a", title: "Abbey Road", artist: "The Beatles" }],
        )).toEqual([])
    })
})
