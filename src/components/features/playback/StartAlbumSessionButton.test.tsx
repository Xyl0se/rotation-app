import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import StartAlbumSessionButton from "./StartAlbumSessionButton"
import { AlbumSessionContext, type AlbumSessionContextValue } from "../../../contexts/albumSessionState"
import { BindingsContext, type BindingsState } from "../../../contexts/bindingsState"
import { I18nProvider } from "../../../i18n/I18nProvider"

function createIdleState(): AlbumSessionContextValue {
    return {
        state: { kind: "idle" },
        actions: {
            start: vi.fn(),
            pause: vi.fn(),
            resume: vi.fn(),
            stop: vi.fn(),
            retry: vi.fn(),
            restart: vi.fn(),
            dismiss: vi.fn(),
        },
    }
}

function createPlayingState(albumId: string): AlbumSessionContextValue {
    return {
        state: {
            kind: "playing",
            sessionId: "test-session",
            albumId,
                manifest: {
                    albumId,
                    title: "Test Album",
                    artist: "Test Artist",
                    coverPath: null,
                    totalDuration: 180,
                    tracks: [{
                        opaqueTrackId: "t1",
                        discNumber: 1,
                        trackNumber: 1,
                        title: "Track 1",
                        duration: 180,
                        mediaType: "mp3",
                        playable: true,
                        _sourcePath: "/music/test/01.mp3",
                    }],
                    orderingDiagnostic: "ok",
                },
            currentTrackIndex: 0,
            currentTime: 0,
            trackDuration: 180,
        },
        actions: {
            start: vi.fn(),
            pause: vi.fn(),
            resume: vi.fn(),
            stop: vi.fn(),
            retry: vi.fn(),
            restart: vi.fn(),
            dismiss: vi.fn(),
        },
    }
}

function createLoadingState(albumId: string): AlbumSessionContextValue {
    return {
        state: { kind: "loading", sessionId: "test-session", albumId },
        actions: {
            start: vi.fn(),
            pause: vi.fn(),
            resume: vi.fn(),
            stop: vi.fn(),
            retry: vi.fn(),
            restart: vi.fn(),
            dismiss: vi.fn(),
        },
    }
}

function createMockBindings(confirmed: boolean, state: "proposed" | "confirmed" | "missing" = "confirmed"): BindingsState {
    return {
        bindings: confirmed
            ? [{
                albumId: "album-1",
                relativePath: "/music/test",
                state,
                matchSource: null,
                proposedAt: null,
                confirmedAt: "2024-01-01",
                libraryAlbumId: "album-1",
                folderExists: true,
                libraryExists: true,
            }]
            : [],
        orphans: [],
        loading: false,
        error: null,
        refresh: vi.fn(),
        isAlbumBound: () => confirmed,
        getBindingForAlbum: () => undefined,
        isLibraryAlbumBound: () => confirmed,
        getBindingForLibraryAlbum: (id: string) =>
            confirmed
                ? {
                    albumId: id,
                    relativePath: "/music/test",
                    state,
                    matchSource: null,
                    proposedAt: null,
                    confirmedAt: "2024-01-01",
                    libraryAlbumId: id,
                    folderExists: true,
                    libraryExists: true,
                }
                : undefined,
    }
}

function renderWithProviders(
    ui: React.ReactElement,
    sessionValue: AlbumSessionContextValue,
    bindingsValue: BindingsState
) {
    return render(
        <I18nProvider>
            <AlbumSessionContext.Provider value={sessionValue}>
                <BindingsContext.Provider value={bindingsValue}>
                    {ui}
                </BindingsContext.Provider>
            </AlbumSessionContext.Provider>
        </I18nProvider>
    )
}

describe("StartAlbumSessionButton", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.stubGlobal("localStorage", { getItem: vi.fn(() => "de"), setItem: vi.fn() })
    })

    it("shows play button when binding is confirmed and no session is active", () => {
        const session = createIdleState()
        const bindings = createMockBindings(true)

        renderWithProviders(
            <StartAlbumSessionButton albumId="album-1" albumTitle="Test Album" />,
            session,
            bindings
        )

        expect(screen.getByRole("button", { name: /Album abspielen/i })).toBeTruthy()
    })

    it("shows pause button when album is currently playing", () => {
        const session = createPlayingState("album-1")
        const bindings = createMockBindings(true)

        renderWithProviders(
            <StartAlbumSessionButton albumId="album-1" albumTitle="Test Album" />,
            session,
            bindings
        )

        expect(screen.getByRole("button", { name: /Pausieren/i })).toBeTruthy()
    })

    it("shows loading state when manifest is loading for this album", () => {
        const session = createLoadingState("album-1")
        const bindings = createMockBindings(true)

        renderWithProviders(
            <StartAlbumSessionButton albumId="album-1" albumTitle="Test Album" />,
            session,
            bindings
        )

        expect(screen.getByRole("status")).toBeTruthy()
    })

    it("shows unavailability message when no binding exists", () => {
        const session = createIdleState()
        const bindings = createMockBindings(false)

        renderWithProviders(
            <StartAlbumSessionButton albumId="album-1" albumTitle="Test Album" />,
            session,
            bindings
        )

        expect(screen.getByRole("status")).toBeTruthy()
    })

    it("shows unavailability message when binding is not confirmed", () => {
        const session = createIdleState()
        const bindings = createMockBindings(true, "proposed")

        renderWithProviders(
            <StartAlbumSessionButton albumId="album-1" albumTitle="Test Album" />,
            session,
            bindings
        )

        expect(screen.getByRole("status")).toBeTruthy()
    })

    it("calls start when play button is clicked", () => {
        const session = createIdleState()
        const bindings = createMockBindings(true)

        renderWithProviders(
            <StartAlbumSessionButton albumId="album-1" albumTitle="Test Album" />,
            session,
            bindings
        )

        fireEvent.click(screen.getByRole("button", { name: /Album abspielen/i }))
        expect(session.actions.start).toHaveBeenCalledWith("album-1")
    })

    it("calls pause when pause button is clicked during playback", () => {
        const session = createPlayingState("album-1")
        const bindings = createMockBindings(true)

        renderWithProviders(
            <StartAlbumSessionButton albumId="album-1" albumTitle="Test Album" />,
            session,
            bindings
        )

        fireEvent.click(screen.getByRole("button", { name: /Pausieren/i }))
        expect(session.actions.pause).toHaveBeenCalled()
    })

    it("does not show play button for a different album when one is playing", () => {
        const session = createPlayingState("album-2")
        const bindings = createMockBindings(true)

        renderWithProviders(
            <StartAlbumSessionButton albumId="album-1" albumTitle="Test Album" />,
            session,
            bindings
        )

        expect(screen.getByRole("button", { name: /Album abspielen/i })).toBeTruthy()
    })
})