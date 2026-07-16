import { afterEach, describe, expect, it, vi } from "vitest"
import { searchAlbum } from "./albumMetadata"

afterEach(() => vi.unstubAllGlobals())

describe("searchAlbum cover candidates", () => {
    it("returns three ordered matching releases and the release group as bounded fallbacks", async () => {
        vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
            releases: [
                { id: "release-1", title: "Album", date: "2001-01-01", "release-group": { id: "group-1" } },
                { id: "release-2", title: "Album" },
                { id: "release-3", title: "Album" },
                { id: "release-4", title: "Album" },
            ],
        }), { status: 200, headers: { "content-type": "application/json" } })))

        const result = await searchAlbum("Album", "Artist")

        expect(result?.coverCandidates).toEqual([
            "https://coverartarchive.org/release/release-1/front",
            "https://coverartarchive.org/release/release-2/front",
            "https://coverartarchive.org/release/release-3/front",
            "https://coverartarchive.org/release-group/group-1/front",
        ])
        expect(result?.coverUrl).toBe(result?.coverCandidates?.[0])
    })

    it("keeps a genuine underscore when the original title matches", async () => {
        const fetchMock = vi.fn(async () => new Response(JSON.stringify({
            releases: [{ id: "original", title: "Album_Name" }],
        }), { status: 200 }))
        vi.stubGlobal("fetch", fetchMock)

        const result = await searchAlbum("Album_Name", "Artist")

        expect(result?.title).toBe("Album_Name")
        expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    it("tries a colon variant when a filesystem replaced punctuation with an underscore", async () => {
        const fetchMock = vi.fn()
            .mockResolvedValueOnce(new Response(JSON.stringify({ releases: [] }), { status: 200 }))
            .mockResolvedValueOnce(new Response(JSON.stringify({
                releases: [{ id: "colon", title: "Album: Subtitle", date: "2003" }],
            }), { status: 200 }))
        vi.stubGlobal("fetch", fetchMock)

        const result = await searchAlbum("Album_ Subtitle", "Artist")

        expect(result?.title).toBe("Album: Subtitle")
        expect(fetchMock).toHaveBeenCalledTimes(2)
        const secondUrl = String(fetchMock.mock.calls[1]?.[0])
        expect(decodeURIComponent(secondUrl)).toContain('release:"Album: Subtitle"')
    })

    it("falls back to a punctuation-independent word query after bounded exact variants", async () => {
        const fetchMock = vi.fn()
            .mockResolvedValueOnce(new Response(JSON.stringify({ releases: [] }), { status: 200 }))
            .mockResolvedValueOnce(new Response(JSON.stringify({ releases: [] }), { status: 200 }))
            .mockResolvedValueOnce(new Response(JSON.stringify({ releases: [] }), { status: 200 }))
            .mockResolvedValueOnce(new Response(JSON.stringify({ releases: [] }), { status: 200 }))
            .mockResolvedValueOnce(new Response(JSON.stringify({
                releases: [{ id: "loose", title: "Album: Subtitle" }],
            }), { status: 200 }))
        vi.stubGlobal("fetch", fetchMock)

        const result = await searchAlbum("Album_ Subtitle", "Artist")

        expect(result?.title).toBe("Album: Subtitle")
        expect(fetchMock).toHaveBeenCalledTimes(5)
        const finalUrl = String(fetchMock.mock.calls[4]?.[0])
        expect(decodeURIComponent(finalUrl)).toContain("release:Album Subtitle")
    })
})
