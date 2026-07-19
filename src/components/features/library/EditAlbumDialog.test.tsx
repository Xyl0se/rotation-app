import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
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

afterEach(() => vi.unstubAllGlobals())

describe("EditAlbumDialog Album Coach", () => {
    it("shows a sanitized reason after cover retry", async () => {
        render(
            <I18nContext.Provider value={{ t: en, language: "en", setLanguage: () => {} }}>
                <EditAlbumDialog
                    album={rolelessAlbum}
                    onClose={() => {}}
                    onSave={async () => true}
                    onUpdateCoverOverride={async () => true}
                    onRemoveCoverOverride={async () => true}
                    onRetryCover={async () => ({
                        status: "temporarily-unavailable",
                        sourceType: null,
                        lastAttemptAt: "2026-07-19T12:00:00.000Z",
                        lastSuccessAt: null,
                        localCandidateFound: false,
                        lastResolutionAt: "2026-07-19T12:00:00.000Z",
                        resolvedAt: null,
                        candidateCount: 0,
                        hasCachedCover: false,
                        source: null,
                        failureCode: "remote-temporarily-unavailable",
                        sizeBytes: null,
                        mimeType: null,
                        width: null,
                        height: null,
                    })}
                />
            </I18nContext.Provider>,
        )

        fireEvent.click(screen.getByRole("button", { name: "Find cover again" }))
        await waitFor(() => expect(screen.getByRole("status").textContent)
            .toBe("The remote cover provider is temporarily unavailable."))
    })

    it("imports a URL once as a server-cached alternative cover", async () => {
        const image = new Blob(["image"], { type: "image/png" })
        const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
            void input
            return {
                ok: true,
                blob: async () => image,
            } as Response
        })
        vi.stubGlobal("fetch", fetchMock)
        const onUpdateCoverOverride = vi.fn(async () => true)
        const onClose = vi.fn()
        render(
            <I18nContext.Provider value={{ t: en, language: "en", setLanguage: () => {} }}>
                <EditAlbumDialog
                    album={rolelessAlbum}
                    onClose={onClose}
                    onSave={async () => true}
                    onUpdateCoverOverride={onUpdateCoverOverride}
                    onRemoveCoverOverride={async () => true}
                />
            </I18nContext.Provider>,
        )

        const urlInputs = screen.getAllByPlaceholderText("https://...")
        fireEvent.change(urlInputs[1], { target: { value: "https://example.test/cover.png" } })
        fireEvent.click(screen.getByRole("button", { name: "Load" }))

        await waitFor(() => expect(onUpdateCoverOverride)
            .toHaveBeenCalledWith(rolelessAlbum.id, expect.any(Blob), "alternative"))
        expect(fetchMock.mock.calls.filter(([url]) => url === "https://example.test/cover.png"))
            .toHaveLength(1)
        expect(onClose).toHaveBeenCalled()
    })

    it("offers digital acquisition and an explicit unknown answer", () => {
        render(
            <I18nContext.Provider value={{ t: en, language: "en", setLanguage: () => {} }}>
                <EditAlbumDialog album={rolelessAlbum} onClose={() => {}} onSave={async () => true}
                    onUpdateCoverOverride={async () => true} onRemoveCoverOverride={async () => true} />
            </I18nContext.Provider>,
        )
        expect(screen.getByRole("option", { name: "iTunes / Online" })).toBeTruthy()
        expect(screen.getAllByRole("option", { name: "I don't remember" })).toHaveLength(2)
    })
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
                    onRemoveCoverOverride={async () => true}
                    onStartCoach={onStartCoach}
                />
            </I18nContext.Provider>,
        )

        fireEvent.click(screen.getByRole("button", { name: "Change role with Album Coach" }))
        expect(onStartCoach).toHaveBeenCalledWith(rolelessAlbum.id)
    })
})
