import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { I18nContext } from "../../../../i18n/I18nContext"
import { en } from "../../../../i18n/locales/en"
import RecoveryDialog from "../RecoveryDialog"
import type { PlaybackManifest } from "../../../../services/api/playbackService"

vi.mock("../../../../services/api/playbackService.js", () => ({
    getPlaybackManifest: vi.fn(),
    buildMediaUrl: vi.fn(() => ""),
    getPlaybackErrorMessage: vi.fn(() => "Playback error"),
}))

const mockManifest: PlaybackManifest = {
    albumId: "album-1",
    title: "Test Album",
    artist: "Test Artist",
    coverPath: null,
    totalDuration: 600,
    tracks: [
        {
            opaqueTrackId: "t1",
            discNumber: 1,
            trackNumber: 1,
            title: "Track One",
            duration: 180,
            mediaType: "mp3",
            playable: true,
            _sourcePath: "/music/t1.mp3",
        },
    ],
    orderingDiagnostic: "ok",
}

function renderDialog(props: {
    open?: boolean
    albumId?: string
    manifest?: PlaybackManifest
    onChoice?: (choice: "continue" | "restart" | "dismiss", freshManifest?: PlaybackManifest) => void
} = {}) {
    const {
        open = true,
        albumId = "album-1",
        manifest = mockManifest,
        onChoice = vi.fn(),
    } = props

    return render(
        <I18nContext.Provider value={{ t: en, language: "en", setLanguage: vi.fn() }}>
            <RecoveryDialog open={open} albumId={albumId} manifest={manifest} onChoice={onChoice} />
        </I18nContext.Provider>
    )
}

describe("RecoveryDialog", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("renders nothing when closed", () => {
        const { container } = renderDialog({ open: false })
        expect(container.firstChild).toBeNull()
    })

    it("renders album title in description", () => {
        renderDialog()
        expect(screen.getByText(/Test Album/)).toBeTruthy()
    })

    it("calls onChoice with 'restart' when Restart clicked", () => {
        const onChoice = vi.fn()
        renderDialog({ onChoice })

        const restartBtn = screen.getByRole("button", { name: /Restart/i })
        fireEvent.click(restartBtn)

        expect(onChoice).toHaveBeenCalledWith("restart")
    })

    it("calls onChoice with 'dismiss' when Dismiss clicked", () => {
        const onChoice = vi.fn()
        renderDialog({ onChoice })

        const dismissBtn = screen.getByRole("button", { name: /Dismiss/i })
        fireEvent.click(dismissBtn)

        expect(onChoice).toHaveBeenCalledWith("dismiss")
    })

    it("has dialog role with aria-modal", () => {
        renderDialog()
        const dialog = screen.getByRole("dialog")
        expect(dialog.getAttribute("aria-modal")).toBe("true")
    })

    it("calls dismiss on Escape key via Dialog overlay", () => {
        const onChoice = vi.fn()
        renderDialog({ onChoice })

        fireEvent.keyDown(document, { key: "Escape" })

        expect(onChoice).toHaveBeenCalledWith("dismiss")
    })
})