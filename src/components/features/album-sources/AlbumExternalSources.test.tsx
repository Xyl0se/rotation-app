import { render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { I18nContext } from "../../../i18n/I18nContext"
import { en } from "../../../i18n/locales/en"
import type { AlbumSource } from "../../../types/album"
import AlbumExternalSources from "./AlbumExternalSources"

const source = (provider: AlbumSource["provider"], url: string, extra: Partial<AlbumSource> = {}): AlbumSource => ({
    provider, url, externalId: provider === "wikidata" ? "Q42" : "id", resolutionStatus: "resolved",
    resolvedAt: "2026-07-20T20:00:00.000Z", confirmedByUser: true, ...extra,
})
const renderSources = (sources: AlbumSource[]) => render(<I18nContext.Provider value={{ t: en, language: "en", setLanguage: vi.fn() }}><AlbumExternalSources sources={sources} /></I18nContext.Provider>)

afterEach(() => vi.unstubAllGlobals())

describe("AlbumExternalSources", () => {
    it("renders stored links safely without a provider request", () => {
        const fetchMock = vi.fn()
        vi.stubGlobal("fetch", fetchMock)
        renderSources([
            source("musicbrainz", "https://musicbrainz.org/release/123"),
            source("wikipedia", "https://de.wikipedia.org/wiki/Album", { locale: "de" }),
            source("wikidata", "https://www.wikidata.org/wiki/Q42"),
        ])
        const links = screen.getAllByRole("link")
        expect(links).toHaveLength(2)
        expect(links.map(link => link.getAttribute("href"))).toEqual(["https://musicbrainz.org/release/123", "https://de.wikipedia.org/wiki/Album"])
        for (const link of links) { expect(link.getAttribute("target")).toBe("_blank"); expect(link.getAttribute("rel")).toBe("noopener noreferrer") }
        expect(fetchMock).not.toHaveBeenCalled()
    })

    it("uses Wikidata only as fallback and omits unsafe or unavailable records", () => {
        const view = renderSources([
            source("wikidata", "https://www.wikidata.org/wiki/Q42"),
            source("wikipedia", "javascript:alert(1)", { locale: "en" }),
            source("musicbrainz", "https://evil.example/release/123"),
            { ...source("wikipedia", "https://en.wikipedia.org/wiki/Missing", { locale: "en" }), resolutionStatus: "missing" },
        ])
        expect(screen.getAllByRole("link")).toHaveLength(1)
        expect(screen.getByRole("link").getAttribute("href")).toBe("https://www.wikidata.org/wiki/Q42")
        view.rerender(<I18nContext.Provider value={{ t: en, language: "en", setLanguage: vi.fn() }}><AlbumExternalSources sources={[]} /></I18nContext.Provider>)
        expect(screen.queryByRole("heading", { name: "External sources" })).toBeNull()
    })
})
