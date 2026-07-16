import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { I18nContext } from "../../../i18n/I18nContext"
import { en } from "../../../i18n/locales/en"
import type { Album } from "../../../types/album"
import type { Binding } from "../../../services/api/bindingsService"
import EditAlbumDialog from "./EditAlbumDialog"

const rolelessAlbum: Album = {
    id: "762afc5e-5408-4d9d-b48a-237874d7ec34",
    title: "Roleless Album",
    artist: "Artist",
    year: "",
    roleHistory: [],
    listenCount: 0,
    lastListened: null,
}

describe("EditAlbumDialog Album Coach", () => {
    it("shows the folder assigned through the library binding", () => {
        const binding: Binding = {
            albumId: "file-album-id",
            libraryAlbumId: rolelessAlbum.id,
            relativePath: "Artist/Roleless Album",
            state: "confirmed",
            matchSource: "manual",
            proposedAt: null,
            confirmedAt: "2026-07-16T10:00:00.000Z",
            folderExists: true,
            libraryExists: true,
        }
        render(
            <I18nContext.Provider value={{ t: en, language: "en", setLanguage: () => {} }}>
                <EditAlbumDialog
                    album={rolelessAlbum}
                    binding={binding}
                    onClose={() => {}}
                    onSave={async () => true}
                    onUpdateCoverOverride={async () => true}
                    onSetCoverUrlOverride={async () => true}
                    onRemoveCoverOverride={async () => true}
                />
            </I18nContext.Provider>,
        )

        expect(screen.getByText("Artist/Roleless Album")).toBeTruthy()
        expect(screen.queryByText("Not bound to any folder")).toBeNull()
    })

    it("offers the Album Coach for an Album without a role", () => {
        const onStartCoach = vi.fn()
        render(
            <I18nContext.Provider value={{ t: en, language: "en", setLanguage: () => {} }}>
                <EditAlbumDialog
                    album={rolelessAlbum}
                    onClose={() => {}}
                    onSave={async () => true}
                    onUpdateCoverOverride={async () => true}
                    onSetCoverUrlOverride={async () => true}
                    onRemoveCoverOverride={async () => true}
                    onStartCoach={onStartCoach}
                />
            </I18nContext.Provider>,
        )

        fireEvent.click(screen.getByRole("button", { name: "Determine role with Album Coach" }))
        expect(onStartCoach).toHaveBeenCalledWith(rolelessAlbum.id)
    })

    it("offers role reassessment when a role already exists", () => {
        const onStartCoach = vi.fn()
        render(
            <I18nContext.Provider value={{ t: en, language: "en", setLanguage: () => {} }}>
                <EditAlbumDialog
                    album={{ ...rolelessAlbum, category: "classic" }}
                    onClose={() => {}}
                    onSave={async () => true}
                    onUpdateCoverOverride={async () => true}
                    onSetCoverUrlOverride={async () => true}
                    onRemoveCoverOverride={async () => true}
                    onStartCoach={onStartCoach}
                />
            </I18nContext.Provider>,
        )

        fireEvent.click(screen.getByRole("button", { name: "Change role with Album Coach" }))
        expect(onStartCoach).toHaveBeenCalledWith(rolelessAlbum.id)
    })
})
