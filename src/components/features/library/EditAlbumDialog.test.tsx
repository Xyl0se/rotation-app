import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { I18nContext } from "../../../i18n/I18nContext"
import { en } from "../../../i18n/locales/en"
import type { Album } from "../../../types/album"
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

    it("does not offer role determination when a role already exists", () => {
        render(
            <I18nContext.Provider value={{ t: en, language: "en", setLanguage: () => {} }}>
                <EditAlbumDialog
                    album={{ ...rolelessAlbum, category: "classic" }}
                    onClose={() => {}}
                    onSave={async () => true}
                    onUpdateCoverOverride={async () => true}
                    onSetCoverUrlOverride={async () => true}
                    onRemoveCoverOverride={async () => true}
                    onStartCoach={() => {}}
                />
            </I18nContext.Provider>,
        )

        expect(screen.queryByRole("button", { name: "Determine role with Album Coach" })).toBeNull()
    })
})
