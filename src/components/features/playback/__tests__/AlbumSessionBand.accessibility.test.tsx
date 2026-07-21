import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { I18nContext } from "../../../../i18n/I18nContext"
import { en } from "../../../../i18n/locales/en"
import { AlbumSessionContext, type AlbumSessionContextValue } from "../../../../contexts/albumSessionState"
import AlbumSessionBand from "../AlbumSessionBand"

function makeManifest() {
    return {
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
                mediaType: "mp3" as const,
                playable: true,
                _sourcePath: "/music/t1.mp3",
            },
            {
                opaqueTrackId: "t2",
                discNumber: 1,
                trackNumber: 2,
                title: "Track Two",
                duration: 200,
                mediaType: "mp3" as const,
                playable: true,
                _sourcePath: "/music/t2.mp3",
            },
        ],
        orderingDiagnostic: "ok" as const,
    }
}

function renderBand(value: AlbumSessionContextValue) {
    return render(
        <I18nContext.Provider value={{ t: en, language: "en", setLanguage: vi.fn() }}>
            <AlbumSessionContext.Provider value={value}>
                <AlbumSessionBand />
            </AlbumSessionContext.Provider>
        </I18nContext.Provider>
    )
}

describe("AlbumSessionBand accessibility", () => {
    const mockActions = {
        start: vi.fn(),
        pause: vi.fn(),
        resume: vi.fn(),
        stop: vi.fn(),
        retry: vi.fn(),
        restart: vi.fn(),
        dismiss: vi.fn(),
        dismissCompletedEvent: vi.fn(),
    }

    beforeEach(() => {
        vi.useFakeTimers({ shouldAdvanceTime: true })
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it("has role=region with descriptive aria-label", () => {
        renderBand({
            state: {
                kind: "playing",
                albumId: "album-1",
                manifest: makeManifest(),
                currentTrackIndex: 0,
                currentTime: 30,
                trackDuration: 180,
                sessionId: "s1",
            },
            completedEvent: null,
            actions: mockActions,
        })

        const region = screen.getByRole("region")
        expect(region).toBeTruthy()
        expect(region.getAttribute("aria-label")).toBe("Test Artist — Test Album")
    })

    it("Play/Pause button has aria-pressed=true when playing", () => {
        renderBand({
            state: {
                kind: "playing",
                albumId: "album-1",
                manifest: makeManifest(),
                currentTrackIndex: 0,
                currentTime: 30,
                trackDuration: 180,
                sessionId: "s1",
            },
            completedEvent: null,
            actions: mockActions,
        })

        const btn = screen.getByRole("button", { name: /Pause/i })
        expect(btn.getAttribute("aria-pressed")).toBe("true")
    })

    it("Play/Pause button has aria-pressed=false when paused", () => {
        renderBand({
            state: {
                kind: "paused",
                albumId: "album-1",
                manifest: makeManifest(),
                currentTrackIndex: 0,
                currentTime: 30,
                trackDuration: 180,
                sessionId: "s1",
            },
            completedEvent: null,
            actions: mockActions,
        })

        const btn = screen.getByRole("button", { name: /Play/i })
        expect(btn.getAttribute("aria-pressed")).toBe("false")
    })

    it("expand/collapse button has aria-expanded", () => {
        renderBand({
            state: {
                kind: "playing",
                albumId: "album-1",
                manifest: makeManifest(),
                currentTrackIndex: 0,
                currentTime: 30,
                trackDuration: 180,
                sessionId: "s1",
            },
            completedEvent: null,
            actions: mockActions,
        })

        const btn = screen.getByRole("button", { name: /Details/i })
        expect(btn.getAttribute("aria-expanded")).toBe("false")

        fireEvent.click(btn)
        expect(btn.getAttribute("aria-expanded")).toBe("true")
    })

    it("renders alert role for recoverable error", () => {
        renderBand({
            state: {
                kind: "recoverable-error",
                albumId: "album-1",
                manifest: makeManifest(),
                currentTrackIndex: 0,
                currentTime: 30,
                trackDuration: 180,
                sessionId: "s1",
                error: "Network timeout",
            },
            completedEvent: null,
            actions: mockActions,
        })

        const expandBtn = screen.getByRole("button", { name: /Details/i })
        fireEvent.click(expandBtn)

        const alert = screen.getByRole("alert")
        expect(alert.textContent).toContain("Network timeout")
    })

    it("restart confirmation has alertdialog role with labelledby", () => {
        renderBand({
            state: {
                kind: "playing",
                albumId: "album-1",
                manifest: makeManifest(),
                currentTrackIndex: 0,
                currentTime: 30,
                trackDuration: 180,
                sessionId: "s1",
            },
            completedEvent: null,
            actions: mockActions,
        })

        const expandBtn = screen.getByRole("button", { name: /Details/i })
        fireEvent.click(expandBtn)

        const restartBtn = screen.getByRole("button", { name: /Restart/i })
        fireEvent.click(restartBtn)

        const dialog = screen.getByRole("alertdialog")
        expect(dialog).toBeTruthy()

        const titleId = dialog.getAttribute("aria-labelledby")
        const title = document.getElementById(titleId!)
        expect(title!.textContent).toMatch(/restart this Album/i)
    })

    it("contains a live region for screen reader announcements", () => {
        const { container } = renderBand({
            state: {
                kind: "playing",
                albumId: "album-1",
                manifest: makeManifest(),
                currentTrackIndex: 0,
                currentTime: 30,
                trackDuration: 180,
                sessionId: "s1",
            },
            completedEvent: null,
            actions: mockActions,
        })

        const liveRegion = container.querySelector('[aria-live="polite"]')
        expect(liveRegion).toBeTruthy()
        expect(liveRegion!.getAttribute("aria-atomic")).toBe("true")
    })

    it("announces completion status in live region", () => {
        const { container } = renderBand({
            state: {
                kind: "completed",
                albumId: "album-1",
                manifest: makeManifest(),
                sessionId: "s1",
            },
            completedEvent: null,
            actions: mockActions,
        })

        const expandBtn = screen.getByRole("button", { name: /Details/i })
        fireEvent.click(expandBtn)

        const liveRegion = container.querySelector('[aria-live="polite"]')
        expect(liveRegion!.textContent).toMatch(/completed|beendet/i)
    })

    it("is not rendered when idle", () => {
        const { container } = renderBand({
            state: { kind: "idle" },
            completedEvent: null,
            actions: mockActions,
        })

        expect(container.firstChild).toBeNull()
    })

    it("shows 'Write in Journal' button when completedEvent is present", () => {
        renderBand({
            state: {
                kind: "completed",
                albumId: "album-1",
                manifest: makeManifest(),
                sessionId: "s1",
            },
            completedEvent: {
                id: "event-123",
                albumId: "album-1",
                listenedAt: "2026-01-01T12:00:00.000Z",
            },
            actions: mockActions,
        })

        const expandBtn = screen.getByRole("button", { name: /Details/i })
        fireEvent.click(expandBtn)

        expect(screen.getByRole("button", { name: /Write in Journal/i })).toBeTruthy()
    })

    it("does not show 'Write in Journal' button without completedEvent", () => {
        renderBand({
            state: {
                kind: "completed",
                albumId: "album-1",
                manifest: makeManifest(),
                sessionId: "s1",
            },
            completedEvent: null,
            actions: mockActions,
        })

        const expandBtn = screen.getByRole("button", { name: /Details/i })
        fireEvent.click(expandBtn)

        expect(screen.queryByRole("button", { name: /Write in Journal/i })).toBeNull()
    })

    it("does not show restart button when completed (journal offer shown instead)", () => {
        renderBand({
            state: {
                kind: "completed",
                albumId: "album-1",
                manifest: makeManifest(),
                sessionId: "s1",
            },
            completedEvent: {
                id: "event-123",
                albumId: "album-1",
                listenedAt: "2026-01-01T12:00:00.000Z",
            },
            actions: mockActions,
        })

        const expandBtn = screen.getByRole("button", { name: /Details/i })
        fireEvent.click(expandBtn)

        expect(screen.queryByRole("button", { name: /Restart Album/i })).toBeNull()
    })

    it("shows restart button in completed state when journal was dismissed", () => {
        renderBand({
            state: {
                kind: "completed",
                albumId: "album-1",
                manifest: makeManifest(),
                sessionId: "s1",
            },
            completedEvent: null,
            actions: mockActions,
        })

        const expandBtn = screen.getByRole("button", { name: /Details/i })
        fireEvent.click(expandBtn)

        expect(screen.getByRole("button", { name: /Restart Album/i })).toBeTruthy()
    })
})
