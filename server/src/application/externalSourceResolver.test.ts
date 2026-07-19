import { describe, expect, it, vi } from "vitest"
import { createExternalSourceResolver } from "./externalSourceResolver.js"

const RELEASE = "123e4567-e89b-42d3-a456-426614174000"
const json = (body: unknown) => new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } })

describe("external source resolver", () => {
    it("uses one direct entity-correct Wikipedia relationship", async () => {
        const fetchImpl = vi.fn<(input: string | URL | Request, init?: RequestInit) => Promise<Response>>(async () => json({ relations: [{ type: "wikipedia", url: { resource: "https://de.wikipedia.org/wiki/Album" } }] }))
        const sources = await createExternalSourceResolver({ fetchImpl: fetchImpl as typeof fetch, delay: async () => {} })(RELEASE)
        expect(sources).toEqual([expect.objectContaining({ provider: "wikipedia", locale: "de", url: "https://de.wikipedia.org/wiki/Album" })])
        expect(fetchImpl).toHaveBeenCalledTimes(1)
        expect(fetchImpl.mock.calls[0]?.[1]?.headers).toMatchObject({ "User-Agent": expect.stringContaining("Rotation/") })
    })

    it("bridges one Wikidata relationship to German Wikipedia", async () => {
        const fetchImpl = vi.fn()
            .mockResolvedValueOnce(json({ relations: [{ type: "wikidata", url: { resource: "https://www.wikidata.org/wiki/Q42" } }] }))
            .mockResolvedValueOnce(json({ entities: { Q42: { sitelinks: { dewiki: { url: "https://de.wikipedia.org/wiki/Album" }, enwiki: { url: "https://en.wikipedia.org/wiki/Album" } } } } }))
        const sources = await createExternalSourceResolver({ fetchImpl, delay: async () => {} })(RELEASE)
        expect(sources.map(source => [source.provider, source.locale])).toEqual([["wikipedia", "de"], ["wikidata", undefined]])
    })

    it("falls back to English Wikipedia", async () => {
        const fetchImpl = vi.fn()
            .mockResolvedValueOnce(json({ relations: [{ type: "wikidata", url: { resource: "https://www.wikidata.org/wiki/Q42" } }] }))
            .mockResolvedValueOnce(json({ entities: { Q42: { sitelinks: { enwiki: { url: "https://en.wikipedia.org/wiki/Album" } } } } }))
        const sources = await createExternalSourceResolver({ fetchImpl, delay: async () => {} })(RELEASE)
        expect(sources[0]).toMatchObject({ provider: "wikipedia", locale: "en" })
    })

    it("returns no guessed source for no match or ambiguous direct relationships", async () => {
        const noMatch = createExternalSourceResolver({ fetchImpl: vi.fn(async () => json({ relations: [] })), delay: async () => {} })
        await expect(noMatch(RELEASE)).resolves.toEqual([])
        const ambiguous = createExternalSourceResolver({ fetchImpl: vi.fn(async () => json({ relations: [
            { type: "wikipedia", url: { resource: "https://de.wikipedia.org/wiki/Eins" } },
            { type: "wikipedia", url: { resource: "https://en.wikipedia.org/wiki/Two" } },
        ] })), delay: async () => {} })
        await expect(ambiguous(RELEASE)).resolves.toEqual([])
    })

    it("retries a timed-out provider request once and then fails", async () => {
        const fetchImpl = vi.fn(async () => { throw new DOMException("Timed out", "TimeoutError") })
        const resolver = createExternalSourceResolver({ fetchImpl, delay: async () => {}, timeoutMs: 1 })
        await expect(resolver(RELEASE)).rejects.toThrow("Timed out")
        expect(fetchImpl).toHaveBeenCalledTimes(2)
    })
})
