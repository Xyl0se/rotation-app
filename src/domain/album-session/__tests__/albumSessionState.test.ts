import { describe, expect, it, vi, beforeEach } from "vitest"
import {
    createInitialContext,
    albumSessionReducer,
    getCurrentTrack,
    getAlbumProgress,
    type AlbumSessionAction,
} from "../albumSessionState.js"

const mockManifest = {
    albumId: "album-123",
    title: "Test Album",
    artist: "Test Artist",
    coverPath: null,
    totalDuration: 300,
    tracks: [
        {
            opaqueTrackId: "track-1",
            discNumber: 1,
            trackNumber: 1,
            title: "Track One",
            duration: 100,
            mediaType: "mp3" as const,
            playable: true,
            _sourcePath: "01 Track One.mp3",
        },
        {
            opaqueTrackId: "track-2",
            discNumber: 1,
            trackNumber: 2,
            title: "Track Two",
            duration: 100,
            mediaType: "mp3" as const,
            playable: true,
            _sourcePath: "02 Track Two.mp3",
        },
        {
            opaqueTrackId: "track-3",
            discNumber: 1,
            trackNumber: 3,
            title: "Track Three",
            duration: 100,
            mediaType: "mp3" as const,
            playable: true,
            _sourcePath: "03 Track Three.mp3",
        },
    ],
    orderingDiagnostic: "ok" as const,
}

function dispatch(
    ctx = createInitialContext(),
    ...actions: AlbumSessionAction[]
) {
    return actions.reduce(albumSessionReducer, ctx)
}

describe("albumSessionReducer", () => {
    beforeEach(() => {
        vi.useFakeTimers({ shouldAdvanceTime: true })
        vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"))
    })

    describe("START", () => {
        it("transitions idle -> loading", () => {
            const ctx = dispatch(createInitialContext(), { type: "START", albumId: "album-123" })
            expect(ctx.state.kind).toBe("loading")
            expect(ctx.state.albumId).toBe("album-123")
            expect(ctx.lastSessionId).not.toBeNull()
        })

        it("guards against double-start while loading", () => {
            const ctx1 = dispatch(createInitialContext(), { type: "START", albumId: "album-123" })
            const ctx2 = dispatch(ctx1, { type: "START", albumId: "album-456" })
            expect(ctx2.state.kind).toBe("loading")
            expect((ctx2.state as Extract<typeof ctx2.state, { kind: "loading" }>).albumId).toBe("album-123")
            expect(ctx2.lastSessionId).toBe(ctx1.lastSessionId)
        })

        it("guards against double-start while playing", () => {
            const ctx1 = dispatch(createInitialContext(), { type: "START", albumId: "album-123" })
            const sessionId = ctx1.lastSessionId!
            const ctx = dispatch(ctx1, { type: "MANIFEST_LOADED", sessionId, manifest: mockManifest })
            const currentSessionId = ctx.lastSessionId!
            const ctx2 = dispatch(ctx, { type: "START", albumId: "album-456" })
            expect(ctx2.state.kind).toBe("playing")
            expect(ctx2.lastSessionId).toBe(currentSessionId)
        })

        it("resets completedTracks", () => {
            const ctx1 = dispatch(createInitialContext(), { type: "START", albumId: "album-123" })
            const sid1 = ctx1.lastSessionId!
            const ctx2 = dispatch(ctx1, { type: "MANIFEST_LOADED", sessionId: sid1, manifest: mockManifest })
            const ctx3 = dispatch(ctx2, { type: "TRACK_ENDED", sessionId: sid1, trackIndex: 0 })
            const currentSessionId = ctx3.lastSessionId!
            const ctx4 = dispatch(ctx3, { type: "START", albumId: "album-456" })
            // Should be blocked because we're playing, but if it were allowed:
            expect(ctx4.completedTracks.has(0)).toBe(true)
            // Start a fresh one after stopping
            const ctx5 = dispatch(ctx4, { type: "STOP", sessionId: currentSessionId })
            const ctx6 = dispatch(ctx5, { type: "STOPPED", sessionId: currentSessionId })
            const ctx7 = dispatch(ctx6, { type: "START", albumId: "album-789" })
            expect(ctx7.completedTracks.size).toBe(0)
        })
    })

    describe("MANIFEST_LOADED", () => {
        it("transitions loading -> playing with first track", () => {
            const ctx1 = dispatch(createInitialContext(), { type: "START", albumId: "album-123" })
            const sessionId = ctx1.lastSessionId!
            const ctx2 = dispatch(ctx1, { type: "MANIFEST_LOADED", sessionId, manifest: mockManifest })
            expect(ctx2.state.kind).toBe("playing")
            expect(ctx2.state).toMatchObject({
                currentTrackIndex: 0,
                currentTime: 0,
                trackDuration: 100,
            })
        })

        it("is ignored when stale", () => {
            const ctx1 = dispatch(createInitialContext(), { type: "START", albumId: "album-123" })
            const sid = ctx1.lastSessionId!
            // Bring to playing so STOP works, then start fresh session
            const ctx2 = dispatch(ctx1, { type: "MANIFEST_LOADED", sessionId: sid, manifest: mockManifest })
            const ctx3 = dispatch(ctx2, { type: "STOP", sessionId: sid })
            const ctx4 = dispatch(ctx3, { type: "STOPPED", sessionId: sid })
            const ctx5 = dispatch(ctx4, { type: "START", albumId: "album-456" })
            const newSessionId = ctx5.lastSessionId!
            // Old manifest response arrives
            const ctx6 = dispatch(ctx5, { type: "MANIFEST_LOADED", sessionId: sid, manifest: mockManifest })
            expect(ctx6.state.kind).toBe("loading")
            expect(ctx6.lastSessionId).toBe(newSessionId)
        })

        it("fails when manifest has no tracks", () => {
            const ctx1 = dispatch(createInitialContext(), { type: "START", albumId: "album-123" })
            const sessionId = ctx1.lastSessionId!
            const ctx2 = dispatch(ctx1, {
                type: "MANIFEST_LOADED",
                sessionId,
                manifest: { ...mockManifest, tracks: [] },
            })
            expect(ctx2.state.kind).toBe("terminal-error")
            expect(ctx2.state).toMatchObject({
                error: "Album enthält keine abspielbaren Tracks.",
            })
        })
    })

    describe("MANIFEST_FAILED", () => {
        it("transitions loading -> terminal-error", () => {
            const ctx1 = dispatch(createInitialContext(), { type: "START", albumId: "album-123" })
            const sessionId = ctx1.lastSessionId!
            const ctx2 = dispatch(ctx1, { type: "MANIFEST_FAILED", sessionId, error: "Network error" })
            expect(ctx2.state.kind).toBe("terminal-error")
            expect(ctx2.state).toMatchObject({ error: "Network error" })
        })

        it("is ignored when not loading", () => {
            const ctx = dispatch(createInitialContext(), { type: "MANIFEST_FAILED", sessionId: "any", error: "oops" })
            expect(ctx.state.kind).toBe("idle")
        })
    })

    describe("PLAY", () => {
        it("is no-op during loading", () => {
            const ctx1 = dispatch(createInitialContext(), { type: "START", albumId: "album-123" })
            const sessionId = ctx1.lastSessionId!
            const ctx2 = dispatch(ctx1, { type: "PLAY", sessionId })
            expect(ctx2.state.kind).toBe("loading")
        })

        it("is ignored when not loading", () => {
            const ctx = dispatch(createInitialContext(), { type: "PLAY", sessionId: "any" })
            expect(ctx.state.kind).toBe("idle")
        })
    })

    describe("PAUSE / RESUME", () => {
        it("transitions playing -> paused", () => {
            const ctx1 = dispatch(createInitialContext(), { type: "START", albumId: "album-123" })
            const sid = ctx1.lastSessionId!
            const ctx2 = dispatch(ctx1, { type: "MANIFEST_LOADED", sessionId: sid, manifest: mockManifest })
            const ctx3 = dispatch(ctx2, { type: "PAUSE", sessionId: sid })
            expect(ctx3.state.kind).toBe("paused")
            expect(ctx3.lastToggleAt).toBeGreaterThan(0)
        })

        it("transitions paused -> playing", () => {
            const ctx1 = dispatch(createInitialContext(), { type: "START", albumId: "album-123" })
            const sid = ctx1.lastSessionId!
            const ctx2 = dispatch(ctx1, { type: "MANIFEST_LOADED", sessionId: sid, manifest: mockManifest })
            const ctx3 = dispatch(ctx2, { type: "PAUSE", sessionId: sid })
            // Advance time past toggle guard
            vi.advanceTimersByTime(100)
            const ctx4 = dispatch(ctx3, { type: "RESUME", sessionId: sid })
            expect(ctx4.state.kind).toBe("playing")
        })

        it("guards against rapid pause/resume", () => {
            const ctx1 = dispatch(createInitialContext(), { type: "START", albumId: "album-123" })
            const sid = ctx1.lastSessionId!
            const ctx2 = dispatch(ctx1, { type: "MANIFEST_LOADED", sessionId: sid, manifest: mockManifest })
            const ctx3 = dispatch(ctx2, { type: "PAUSE", sessionId: sid })
            // Immediate resume should be blocked
            const ctx4 = dispatch(ctx3, { type: "RESUME", sessionId: sid })
            expect(ctx4.state.kind).toBe("paused")
        })

        it("ignores pause when not playing", () => {
            const ctx = dispatch(createInitialContext(), { type: "PAUSE", sessionId: "any" })
            expect(ctx.state.kind).toBe("idle")
        })

        it("ignores resume when not paused", () => {
            const ctx = dispatch(createInitialContext(), { type: "RESUME", sessionId: "any" })
            expect(ctx.state.kind).toBe("idle")
        })
    })

    describe("TRACK_ENDED", () => {
        it("advances to next track", () => {
            const ctx1 = dispatch(createInitialContext(), { type: "START", albumId: "album-123" })
            const sid = ctx1.lastSessionId!
            const ctx2 = dispatch(ctx1, { type: "MANIFEST_LOADED", sessionId: sid, manifest: mockManifest })
            const ctx3 = dispatch(ctx2, { type: "TRACK_ENDED", sessionId: sid, trackIndex: 0 })
            expect(ctx3.state.kind).toBe("playing")
            expect(ctx3.state).toMatchObject({
                currentTrackIndex: 1,
                currentTime: 0,
            })
            expect(ctx3.completedTracks.has(0)).toBe(true)
        })

        it("completes album on final track", () => {
            const singleTrackManifest = { ...mockManifest, tracks: [mockManifest.tracks[0]] }
            const ctx1 = dispatch(createInitialContext(), { type: "START", albumId: "album-123" })
            const sid = ctx1.lastSessionId!
            const ctx2 = dispatch(ctx1, { type: "MANIFEST_LOADED", sessionId: sid, manifest: singleTrackManifest })
            const ctx3 = dispatch(ctx2, { type: "TRACK_ENDED", sessionId: sid, trackIndex: 0 })
            expect(ctx3.state.kind).toBe("completed")
            expect(ctx3.completedTracks.has(0)).toBe(true)
        })

        it("guards against duplicate ended for same track", () => {
            const ctx1 = dispatch(createInitialContext(), { type: "START", albumId: "album-123" })
            const sid = ctx1.lastSessionId!
            const ctx2 = dispatch(ctx1, { type: "MANIFEST_LOADED", sessionId: sid, manifest: mockManifest })
            const ctx3 = dispatch(ctx2, { type: "TRACK_ENDED", sessionId: sid, trackIndex: 0 })
            const ctx4 = dispatch(ctx3, { type: "TRACK_ENDED", sessionId: sid, trackIndex: 0 })
            expect(ctx4.state).toMatchObject({
                currentTrackIndex: 1,
            })
        })

        it("ignores when not playing", () => {
            const ctx = dispatch(createInitialContext(), { type: "TRACK_ENDED", sessionId: "any", trackIndex: 0 })
            expect(ctx.state.kind).toBe("idle")
        })
    })

    describe("TIME_UPDATE", () => {
        it("updates currentTime and trackDuration during playing", () => {
            const ctx1 = dispatch(createInitialContext(), { type: "START", albumId: "album-123" })
            const sid = ctx1.lastSessionId!
            const ctx2 = dispatch(ctx1, { type: "MANIFEST_LOADED", sessionId: sid, manifest: mockManifest })
            const ctx3 = dispatch(ctx2, { type: "TIME_UPDATE", sessionId: sid, currentTime: 42, trackDuration: 120 })
            expect(ctx3.state).toMatchObject({
                currentTime: 42,
                trackDuration: 120,
            })
        })

        it("updates during paused", () => {
            const ctx1 = dispatch(createInitialContext(), { type: "START", albumId: "album-123" })
            const sid = ctx1.lastSessionId!
            const ctx2 = dispatch(ctx1, { type: "MANIFEST_LOADED", sessionId: sid, manifest: mockManifest })
            const ctx3 = dispatch(ctx2, { type: "PAUSE", sessionId: sid })
            const ctx4 = dispatch(ctx3, { type: "TIME_UPDATE", sessionId: sid, currentTime: 15, trackDuration: null })
            expect(ctx4.state).toMatchObject({ currentTime: 15 })
        })

        it("ignores when idle", () => {
            const ctx = dispatch(createInitialContext(), { type: "TIME_UPDATE", sessionId: "any", currentTime: 10, trackDuration: 100 })
            expect(ctx.state.kind).toBe("idle")
        })
    })

    describe("AUDIO_ERROR", () => {
        it("transitions playing -> recoverable-error", () => {
            const ctx1 = dispatch(createInitialContext(), { type: "START", albumId: "album-123" })
            const sid = ctx1.lastSessionId!
            const ctx2 = dispatch(ctx1, { type: "MANIFEST_LOADED", sessionId: sid, manifest: mockManifest })
            const ctx3 = dispatch(ctx2, { type: "AUDIO_ERROR", sessionId: sid, error: "Network timeout", recoverable: true })
            expect(ctx3.state.kind).toBe("recoverable-error")
            expect(ctx3.state).toMatchObject({
                currentTrackIndex: 0,
                currentTime: 0,
                error: "Network timeout",
            })
        })

        it("transitions playing -> terminal-error", () => {
            const ctx1 = dispatch(createInitialContext(), { type: "START", albumId: "album-123" })
            const sid = ctx1.lastSessionId!
            const ctx2 = dispatch(ctx1, { type: "MANIFEST_LOADED", sessionId: sid, manifest: mockManifest })
            const ctx3 = dispatch(ctx2, { type: "AUDIO_ERROR", sessionId: sid, error: "Unsupported codec", recoverable: false })
            expect(ctx3.state.kind).toBe("terminal-error")
        })

        it("handles error during loading", () => {
            const ctx1 = dispatch(createInitialContext(), { type: "START", albumId: "album-123" })
            const sessionId = ctx1.lastSessionId!
            const ctx2 = dispatch(ctx1, { type: "AUDIO_ERROR", sessionId, error: "Load failed", recoverable: true })
            expect(ctx2.state.kind).toBe("recoverable-error")
        })

        it("ignores when stale", () => {
            const ctx = dispatch(createInitialContext(), { type: "AUDIO_ERROR", sessionId: "old", error: "oops", recoverable: true })
            expect(ctx.state.kind).toBe("idle")
        })
    })

    describe("STOP / STOPPED", () => {
        it("transitions playing -> stopping", () => {
            const ctx1 = dispatch(createInitialContext(), { type: "START", albumId: "album-123" })
            const sid = ctx1.lastSessionId!
            const ctx2 = dispatch(ctx1, { type: "MANIFEST_LOADED", sessionId: sid, manifest: mockManifest })
            const ctx3 = dispatch(ctx2, { type: "STOP", sessionId: sid })
            expect(ctx3.state.kind).toBe("stopping")
        })

        it("transitions stopping -> idle", () => {
            const ctx1 = dispatch(createInitialContext(), { type: "START", albumId: "album-123" })
            const sid = ctx1.lastSessionId!
            const ctx2 = dispatch(ctx1, { type: "MANIFEST_LOADED", sessionId: sid, manifest: mockManifest })
            const ctx3 = dispatch(ctx2, { type: "STOP", sessionId: sid })
            const ctx4 = dispatch(ctx3, { type: "STOPPED", sessionId: sid })
            expect(ctx4.state.kind).toBe("idle")
            expect(ctx4.lastSessionId).toBeNull()
        })

        it("ignores STOP when idle", () => {
            const ctx = dispatch(createInitialContext(), { type: "STOP", sessionId: "any" })
            expect(ctx.state.kind).toBe("idle")
        })
    })

    describe("RETRY", () => {
        it("transitions recoverable-error -> playing", () => {
            const ctx1 = dispatch(createInitialContext(), { type: "START", albumId: "album-123" })
            const sid = ctx1.lastSessionId!
            const ctx2 = dispatch(ctx1, { type: "MANIFEST_LOADED", sessionId: sid, manifest: mockManifest })
            const ctx3 = dispatch(ctx2, { type: "AUDIO_ERROR", sessionId: sid, error: "oops", recoverable: true })
            const ctx4 = dispatch(ctx3, { type: "RETRY", sessionId: sid })
            expect(ctx4.state.kind).toBe("playing")
        })

        it("ignores when not in recoverable-error", () => {
            const ctx = dispatch(createInitialContext(), { type: "RETRY", sessionId: "any" })
            expect(ctx.state.kind).toBe("idle")
        })
    })

    describe("RESTART", () => {
        it("restarts from playing", () => {
            const ctx1 = dispatch(createInitialContext(), { type: "START", albumId: "album-123" })
            const sid = ctx1.lastSessionId!
            const ctx2 = dispatch(ctx1, { type: "MANIFEST_LOADED", sessionId: sid, manifest: mockManifest })
            const ctx3 = dispatch(ctx2, { type: "TRACK_ENDED", sessionId: sid, trackIndex: 0 })
            const ctx4 = dispatch(ctx3, { type: "RESTART", sessionId: sid })
            expect(ctx4.state.kind).toBe("playing")
            expect(ctx4.state).toMatchObject({
                currentTrackIndex: 0,
                currentTime: 0,
            })
            expect(ctx4.completedTracks.size).toBe(0)
        })

        it("restarts from completed", () => {
            const singleTrackManifest = { ...mockManifest, tracks: [mockManifest.tracks[0]] }
            const ctx1 = dispatch(createInitialContext(), { type: "START", albumId: "album-123" })
            const sid = ctx1.lastSessionId!
            const ctx2 = dispatch(ctx1, { type: "MANIFEST_LOADED", sessionId: sid, manifest: singleTrackManifest })
            const ctx3 = dispatch(ctx2, { type: "TRACK_ENDED", sessionId: sid, trackIndex: 0 })
            const ctx4 = dispatch(ctx3, { type: "RESTART", sessionId: sid })
            expect(ctx4.state.kind).toBe("playing")
            expect(ctx4.state).toMatchObject({
                currentTrackIndex: 0,
                currentTime: 0,
            })
        })

        it("ignores when idle", () => {
            const ctx = dispatch(createInitialContext(), { type: "RESTART", sessionId: "any" })
            expect(ctx.state.kind).toBe("idle")
        })
    })

    describe("DISMISS_ERROR", () => {
        it("transitions terminal-error -> idle", () => {
            const ctx1 = dispatch(createInitialContext(), { type: "START", albumId: "album-123" })
            const sid = ctx1.lastSessionId!
            const ctx2 = dispatch(ctx1, { type: "MANIFEST_FAILED", sessionId: sid, error: "oops" })
            const ctx3 = dispatch(ctx2, { type: "DISMISS_ERROR", sessionId: sid })
            expect(ctx3.state.kind).toBe("idle")
            expect(ctx3.lastSessionId).toBeNull()
        })

        it("transitions completed -> idle", () => {
            const singleTrackManifest = { ...mockManifest, tracks: [mockManifest.tracks[0]] }
            const ctx1 = dispatch(createInitialContext(), { type: "START", albumId: "album-123" })
            const sid = ctx1.lastSessionId!
            const ctx2 = dispatch(ctx1, { type: "MANIFEST_LOADED", sessionId: sid, manifest: singleTrackManifest })
            const ctx3 = dispatch(ctx2, { type: "TRACK_ENDED", sessionId: sid, trackIndex: 0 })
            const ctx4 = dispatch(ctx3, { type: "DISMISS_ERROR", sessionId: sid })
            expect(ctx4.state.kind).toBe("idle")
        })

        it("ignores when idle", () => {
            const ctx = dispatch(createInitialContext(), { type: "DISMISS_ERROR", sessionId: "any" })
            expect(ctx.state.kind).toBe("idle")
        })
    })

    describe("stale session protection", () => {
        it("ignores all actions for old sessionId", () => {
            const ctx1 = dispatch(createInitialContext(), { type: "START", albumId: "album-123" })
            const oldSessionId = ctx1.lastSessionId!

            // Stop and start new session
            const ctx2 = dispatch(ctx1, { type: "STOP", sessionId: oldSessionId })
            const ctx3 = dispatch(ctx2, { type: "STOPPED", sessionId: oldSessionId })
            const ctx4 = dispatch(ctx3, { type: "START", albumId: "album-456" })
            const newSessionId = ctx4.lastSessionId!

            // Old session actions
            const ctx5 = dispatch(ctx4, { type: "PAUSE", sessionId: oldSessionId })
            expect(ctx5.state.kind).toBe("loading")
            expect(ctx5.lastSessionId).toBe(newSessionId)

            const ctx6 = dispatch(ctx5, { type: "TRACK_ENDED", sessionId: oldSessionId, trackIndex: 0 })
            expect(ctx6.state.kind).toBe("loading")
        })
    })
})

describe("getCurrentTrack", () => {
    it("returns current track when playing", () => {
        const state = {
            kind: "playing" as const,
            sessionId: "s1",
            albumId: "a1",
            manifest: mockManifest,
            currentTrackIndex: 1,
            currentTime: 0,
            trackDuration: 100,
        }
        expect(getCurrentTrack(state)?.title).toBe("Track Two")
    })

    it("returns null when idle", () => {
        expect(getCurrentTrack({ kind: "idle" })).toBeNull()
    })
})

describe("getAlbumProgress", () => {
    it("returns 0 when idle", () => {
        expect(getAlbumProgress({ kind: "idle" })).toBe(0)
    })

    it("calculates progress through completed tracks", () => {
        const state = {
            kind: "playing" as const,
            sessionId: "s1",
            albumId: "a1",
            manifest: mockManifest,
            currentTrackIndex: 2,
            currentTime: 50,
            trackDuration: 100,
        }
        // 100 + 100 + 50 = 250 / 300 = 0.8333...
        expect(getAlbumProgress(state)).toBeCloseTo(0.8333, 3)
    })

    it("caps at 1.0", () => {
        const state = {
            kind: "playing" as const,
            sessionId: "s1",
            albumId: "a1",
            manifest: mockManifest,
            currentTrackIndex: 2,
            currentTime: 9999,
            trackDuration: 100,
        }
        expect(getAlbumProgress(state)).toBe(1)
    })

    it("handles missing durations", () => {
        const manifest = {
            ...mockManifest,
            totalDuration: null,
            tracks: mockManifest.tracks.map(t => ({ ...t, duration: null })),
        }
        const state = {
            kind: "playing" as const,
            sessionId: "s1",
            albumId: "a1",
            manifest,
            currentTrackIndex: 0,
            currentTime: 0,
            trackDuration: null,
        }
        expect(getAlbumProgress(state)).toBe(0)
    })
})