import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { I18nContext } from "../../../i18n/I18nContext"
import { de } from "../../../i18n/locales/de"
import type { Album } from "../../../types/album"
import AlbumCard from "./AlbumCard"

const rolelessAlbum: Album = {
    id: "11111111-1111-4111-8111-111111111111",
    title: "Ohne Rolle",
    artist: "Künstler",
    year: "2026",
    roleHistory: [],
    listenCount: 0,
    lastListened: null,
}

function renderCard(album: Album, onStartCoach = vi.fn()) {
    const noop = () => {}
    render(
        <I18nContext.Provider value={{ t: de, language: "de", setLanguage: noop }}>
            <AlbumCard
                album={album}
                isFocus={false}
                onArchive={noop}
                onDelete={noop}
                onEdit={noop}
                onLogListen={noop}
                onReconsider={noop}
                onSetFocus={noop}
                onStartCoach={onStartCoach}
            />
        </I18nContext.Provider>,
    )
    return onStartCoach
}

describe("AlbumCard roleless coach action", () => {
    it("starts the coach directly for an album without a role", () => {
        const onStartCoach = renderCard(rolelessAlbum)
        const button = screen.getByRole("button", { name: "Rolle mit Album Coach bestimmen" })
        expect(button.textContent).toBe("✨")
        fireEvent.click(button)
        expect(onStartCoach).toHaveBeenCalledWith(rolelessAlbum.id)
    })

    it("does not show the coach shortcut for an assigned album", () => {
        renderCard({ ...rolelessAlbum, category: "classic" })
        expect(screen.queryByRole("button", { name: "Rolle mit Album Coach bestimmen" })).toBeNull()
    })
})
