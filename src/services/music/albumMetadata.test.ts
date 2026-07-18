import { afterEach, describe, expect, it, vi } from "vitest"
import { metadataTitleVariants,searchAlbum } from "./albumMetadata"

afterEach(() => vi.unstubAllGlobals())

describe("searchAlbum cover candidates", () => {
    it("normalizes bounded filesystem punctuation and Unicode without losing the original",()=>{
        expect(metadataTitleVariants("Smoke + Mirrors")).toEqual(expect.arrayContaining(["Smoke + Mirrors","Smoke & Mirrors","Smoke and Mirrors","Smoke Mirrors"]))
        expect(metadataTitleVariants("Rock—Roll")).toContain("Rock-Roll")
        expect(metadataTitleVariants("Sinead’s Album")).toContain("Sinead's Album")
        expect(metadataTitleVariants("Cafe\u0301")[0]).toBe("Café")
        expect(metadataTitleVariants("A_ B")).toEqual(expect.arrayContaining(["A_ B","A: B","A B"]))
        expect(metadataTitleVariants("A + B").length).toBeLessThanOrEqual(8)
    })
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
        expect(decodeURIComponent(secondUrl)).toContain('release:"Album\\: Subtitle"')
    })

    it("falls back to a punctuation-independent word query after bounded exact variants", async () => {
        const fetchMock = vi.fn(async (url:string) => new Response(JSON.stringify({ releases:
            decodeURIComponent(String(url)).includes("release:Album Subtitle") ? [{id:"loose",title:"Album: Subtitle"}] : [],
        }), { status: 200 }))
        vi.stubGlobal("fetch", fetchMock)

        const result = await searchAlbum("Album_ Subtitle", "Artist")

        expect(result?.title).toBe("Album: Subtitle")
        expect(fetchMock.mock.calls.length).toBeLessThanOrEqual(9)
        const finalUrl = String(fetchMock.mock.calls.at(-1)?.[0])
        expect(decodeURIComponent(finalUrl)).toContain("release:Album Subtitle")
    })

    it("finds a plus-title through bounded ampersand variants and escapes the original query",async()=>{
        const fetchMock=vi.fn(async(url:string)=>new Response(JSON.stringify({releases:decodeURIComponent(String(url)).includes("Smoke & Mirrors")?[{id:"smoke",title:"Smoke & Mirrors"}]:[]}),{status:200}));vi.stubGlobal("fetch",fetchMock)
        const result=await searchAlbum("Smoke + Mirrors","Imagine Dragons")
        expect(result?.title).toBe("Smoke & Mirrors");expect(fetchMock.mock.calls.length).toBeLessThanOrEqual(4)
        expect(decodeURIComponent(String(fetchMock.mock.calls[0]?.[0]))).toContain("Smoke \\+ Mirrors")
    })
})
