import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { I18nContext } from "../i18n/I18nContext"
import { en } from "../i18n/locales/en"
import BindingsPage from "./BindingsPage"

const mocks = vi.hoisted(() => ({
    fetchBindings: vi.fn(),
    triggerScan: vi.fn(),
    getScanProgress: vi.fn(),
    toastSuccess: vi.fn(),
    toastError: vi.fn(),
    captureBinding: vi.fn(),
    updateAlbum: vi.fn(),
}))

vi.mock("../components/features/diagnostics/DiagnosticsPanel.js", () => ({
    default: () => null,
}))

vi.mock("../components/features/discover-album/DiscoverAlbumDialog.js", () => ({
    default: ({ onFinish, album }: { onFinish: (album: unknown) => void; album: unknown }) => (
        <button onClick={() => onFinish(album)}>Finish capture</button>
    ),
}))

vi.mock("../components/features/album-coach/AlbumCoach.js", () => ({
    default: ({ onComplete }: { onComplete: (role: string) => void }) => (
        <button onClick={() => onComplete("new")}>Complete coach</button>
    ),
}))

vi.mock("../services/api/albumsService.js", () => ({
    updateAlbum: mocks.updateAlbum,
}))

vi.mock("../services/api/bindingsService.js", () => ({
    fetchBindings: mocks.fetchBindings,
    confirmBinding: vi.fn(),
    deleteBinding: vi.fn(),
    verifyBindings: vi.fn(),
    reconcileBindings: vi.fn(),
    captureBinding: mocks.captureBinding,
}))

vi.mock("../services/api/scanService.js", () => ({
    triggerScan: mocks.triggerScan,
    getScanProgress: mocks.getScanProgress,
}))

vi.mock("../hooks/useToast.js", () => ({
    useToast: () => ({ success: mocks.toastSuccess, error: mocks.toastError }),
}))

describe("BindingsPage manual music scan", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mocks.fetchBindings
            .mockResolvedValueOnce({ bindings: [], count: 0 })
            .mockResolvedValueOnce({
                bindings: [{
                    albumId: "Artist/New Album",
                    relativePath: "Artist/New Album",
                    state: "proposed",
                    matchSource: null,
                    proposedAt: "2026-07-15T00:00:00.000Z",
                    confirmedAt: null,
                    libraryAlbumId: null,
                    folderExists: true,
                    libraryExists: false,
                }],
                count: 1,
            })
        mocks.triggerScan.mockResolvedValue({ scanId: "scan-1", status: "completed" })
        mocks.getScanProgress.mockResolvedValue({
            scanId: "scan-1",
            directoriesScanned: 2,
            directoriesSkipped: 0,
            status: "completed",
        })
    })

    it("triggers a scan and refreshes bindings when it completes", async () => {
        render(
            <I18nContext.Provider value={{ t: en, language: "en", setLanguage: () => {} }}>
                <BindingsPage />
            </I18nContext.Provider>,
        )

        const scanButton = await screen.findByRole("button", { name: "Scan music folder" })
        fireEvent.click(scanButton)

        await waitFor(() => expect(mocks.triggerScan).toHaveBeenCalledOnce())
        await waitFor(() => expect(mocks.getScanProgress).toHaveBeenCalledWith("scan-1"))
        await waitFor(() => expect(mocks.fetchBindings).toHaveBeenCalledTimes(2))
        expect(await screen.findByText("Artist/New Album")).toBeTruthy()
        expect(mocks.toastSuccess).toHaveBeenCalledWith(
            "Music scan completed. Bindings have been refreshed.",
        )
    })

    it("uses the atomic server capture operation", async () => {
        mocks.fetchBindings.mockReset()
        mocks.fetchBindings.mockResolvedValue({
            bindings: [{
                albumId: "Artist/New Album",
                relativePath: "Artist/New Album",
                state: "proposed",
                matchSource: null,
                proposedAt: "2026-07-15T00:00:00.000Z",
                confirmedAt: null,
                libraryAlbumId: null,
                folderExists: true,
                libraryExists: false,
                suggestedArtist: "Artist",
                suggestedTitle: "New Album",
            }],
            count: 1,
        })
        mocks.captureBinding.mockImplementation(async (_bindingId: string, album: object) => ({
            album: { ...album, roleHistory: [], listenCount: 0, lastListened: null },
            binding: {},
        }))
        mocks.updateAlbum.mockResolvedValue({})
        render(
            <I18nContext.Provider value={{ t: en, language: "en", setLanguage: () => {} }}>
                <BindingsPage />
            </I18nContext.Provider>,
        )

        fireEvent.click(await screen.findByRole("button", { name: "Capture" }))
        fireEvent.click(await screen.findByRole("button", { name: "Finish capture" }))

        await waitFor(() => expect(mocks.captureBinding).toHaveBeenCalledOnce())
        expect(mocks.captureBinding).toHaveBeenCalledWith(
            "Artist/New Album",
            expect.objectContaining({ id: expect.any(String) }),
        )
        fireEvent.click(await screen.findByRole("button", { name: "Complete coach" }))
        await waitFor(() => expect(mocks.updateAlbum).toHaveBeenCalledWith(
            expect.objectContaining({ category: "new" }),
        ))
    })
})
