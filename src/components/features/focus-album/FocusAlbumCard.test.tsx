import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { I18nContext } from "../../../i18n/I18nContext"
import { de } from "../../../i18n/locales/de"
import type { Album } from "../../../types/album"
import FocusAlbumCard from "./FocusAlbumCard"

vi.mock("../../ui/AlbumCover", () => ({ default: () => <div data-testid="cover" /> }))
vi.mock("../playback/StartAlbumSessionButton", () => ({ default: () => <button data-testid="start-session">Album abspielen</button> }))

const album: Album = {
    id: "11111111-1111-4111-8111-111111111111",
    title: "Kind of Blue",
    artist: "Miles Davis",
    year: "1959",
    category: "classic",
    roleHistory: [],
    listenCount: 3,
    lastListened: null,
}

describe("FocusAlbumCard actions", () => {
    it("separates Album identity from listening status and keeps the listened action accessible", () => {
        const { container } = render(
            <I18nContext.Provider value={{ t: de, language: "de", setLanguage: vi.fn() }}>
                <FocusAlbumCard
                    album={album}
                    onLogListen={vi.fn()}
                    onSuggestAnother={vi.fn()}
                    onEdit={vi.fn()}
                />
            </I18nContext.Provider>,
        )

        expect(container.querySelector(".focus-album-info")).toBeTruthy()
        expect(container.querySelector(".focus-album-listening")).toBeTruthy()
        expect(screen.getByRole("button", { name: "Gehört: Kind of Blue" })).toBeTruthy()
    })

    it("opens Album editing through an accessible action", () => {
        const onEdit = vi.fn()
        render(
            <I18nContext.Provider value={{ t: de, language: "de", setLanguage: vi.fn() }}>
                <FocusAlbumCard
                    album={album}
                    onLogListen={vi.fn()}
                    onSuggestAnother={vi.fn()}
                    onEdit={onEdit}
                />
            </I18nContext.Provider>,
        )

        fireEvent.click(screen.getByRole("button", { name: "Album bearbeiten: Kind of Blue" }))
        expect(onEdit).toHaveBeenCalledOnce()
    })
})
