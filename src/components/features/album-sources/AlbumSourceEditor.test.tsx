import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { I18nContext } from "../../../i18n/I18nContext"
import { en } from "../../../i18n/locales/en"
import { previewAlbumSources, searchAlbumSources } from "../../../services/api/albumsService"
import AlbumSourceEditor from "./AlbumSourceEditor"

vi.mock("../../../services/api/albumsService", async importOriginal => ({ ...await importOriginal<typeof import("../../../services/api/albumsService")>(), searchAlbumSources: vi.fn(), previewAlbumSources: vi.fn() }))

const album = { id: "550e8400-e29b-41d4-a716-446655440000", title: "Album", artist: "Artist", year: "2024", roleHistory: [], listenCount: 0, lastListened: null }
const source = { provider: "musicbrainz" as const, externalId: "123e4567-e89b-42d3-a456-426614174000", url: "https://musicbrainz.org/release/123e4567-e89b-42d3-a456-426614174000", resolutionStatus: "resolved" as const, resolvedAt: "2026-07-20T20:00:00.000Z", confirmedByUser: false }

describe("AlbumSourceEditor", () => {
    it("reviews a match before explicitly saving it", async () => {
        vi.mocked(searchAlbumSources).mockResolvedValue({ candidates: [{ releaseId: source.externalId, title: "Album", artist: "Artist", year: "2024" }] })
        vi.mocked(previewAlbumSources).mockResolvedValue({ sources: [source] })
        const onSave = vi.fn(async () => true)
        render(<I18nContext.Provider value={{ t: en, language: "en", setLanguage: vi.fn() }}><AlbumSourceEditor album={album} onSave={onSave} /></I18nContext.Provider>)
        fireEvent.click(screen.getByRole("button", { name: "Find external sources" }))
        fireEvent.click(await screen.findByRole("button", { name: /Album/ }))
        await waitFor(() => expect(screen.getByDisplayValue(source.url)).toBeTruthy())
        expect(onSave).not.toHaveBeenCalled()
        fireEvent.click(screen.getByRole("button", { name: "Save reviewed sources" }))
        await waitFor(() => expect(onSave).toHaveBeenCalledWith([source]))
    })

    it("allows correction and removal before saving", async () => {
        const onSave = vi.fn(async () => true)
        render(<I18nContext.Provider value={{ t: en, language: "en", setLanguage: vi.fn() }}><AlbumSourceEditor album={{ ...album, sources: [source] }} onSave={onSave} /></I18nContext.Provider>)
        fireEvent.change(screen.getByDisplayValue(source.url), { target: { value: "https://musicbrainz.org/release-group/123e4567-e89b-42d3-a456-426614174000" } })
        fireEvent.click(screen.getByRole("button", { name: "Remove" }))
        fireEvent.click(screen.getByRole("button", { name: "Save reviewed sources" }))
        await waitFor(() => expect(onSave).toHaveBeenCalledWith([]))
    })
})
