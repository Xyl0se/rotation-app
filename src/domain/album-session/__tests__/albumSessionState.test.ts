import { describe, expect, it, vi, beforeEach } from "vitest"
import {
    createInitialContext,
    albumSessionReducer,
    getCurrentTrack,
    getAlbumProgress,
    createRecoveryRecord,
    isRecoveryRecordValid,
    isManifestCompatible,
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

const TEST_SESSION_ID = "test-session-123"

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
            const ctx = dispatch(createInitialContext(), { type: "START", albumId: "album-123", sessionId: TEST_SESSION_ID })
            expect(ctx.state.kind).toBe("loading")
            expect((ctx.state as Extract<typeof ctx.state, { kind: "loading" }>).albumId).toBe("album-123")
            expect(ctx.lastSessionId).toBe(TEST_SESSION_ID)
        })

        it("guards against double-start while loading", () => {
            const ctx1 = dispatch(createInitialContext(), { type: "START", albumId: "album-123", sessionId: TEST_SESSION_ID })
            const ctx2 = dispatch(ctx1, { type: "START", albumId: "album-456", sessionId: "other-session" })
            expect(ctx2.state.kind).toBe("loading")
            expect((ctx2.state as Extract<typeof ctx2.state, { kind: "loading" }>).albumId).toBe("album-123")
            expect(ctx2.lastSessionId).toBe(TEST_SESSION_ID)
        })

        it("guards against double-start while playing", () => {
            const ctx1 = dispatch(createInitialContext(), { type: "START", albumId: "album-123", sessionId: TEST_SESSION_ID })
            const ctx = dispatch(ctx1, { type: "MANIFEST_LOADED", sessionId: TEST_SESSION_ID, manifest: mockManifest })
            const ctx2 = dispatch(ctx, { type: "START", albumId: "album-456", sessionId: "other-session" })
            expect(ctx2.state.kind).toBe("playing")
            expect(ctx2.lastSessionId).toBe(TEST_SESSION_ID)
        })

        it("resets completedTracks", () => {
            const ctx1 = dispatch(createInitialContext(), { type: "START", albumId: "album-123", sessionId: TEST_SESSION_ID })
            const ctx2 = dispatch(ctx1, { type: "MANIFEST_LOADED", sessionId: TEST_SESSION_ID, manifest: mockManifest })
            const ctx3 = dispatch(ctx2, { type: "TRACK_ENDED", sessionId: TEST_SESSION_ID, trackIndex: 0 })
            const ctx4 = dispatch(ctx3, { type: "START", albumId: "album-456", sessionId: "other-session" })
            // Should be blocked because we're playing
            expect(ctx4.completedTracks.has(0)).toBe(true)
            // Start a fresh one after stopping
            const ctx5 = dispatch(ctx4, { type: "STOP", sessionId: TEST_SESSION_ID })
            const ctx6 = dispatch(ctx5, { type: "STOPPED", sessionId: TEST_SESSION_ID })
            const ctx7 = dispatch(ctx6, { type: "START", albumId: "album-789", sessionId: "fresh-session" })
            expect(ctx7.completedTracks.size).toBe(0)
        })
    })

    describe("MANIFEST_LOADED", () => {
        it("transitions loading -> playing with first track", () => {
            const ctx1 = dispatch(createInitialContext(), { type: "START", albumId: "album-123", sessionId: TEST_SESSION_ID })
            const ctx2 = dispatch(ctx1, { type: "MANIFEST_LOADED", sessionId: TEST_SESSION_ID, manifest: mockManifest })
            expect(ctx2.state.kind).toBe("playing")
            expect(ctx2.state).toMatchObject({
                currentTrackIndex: 0,
                currentTime: 0,
                trackDuration: 100,
            })
        })

        it("is ignored when stale", () => {
            const ctx1 = dispatch(createInitialContext(), { type: "START", albumId: "album-123", sessionId: "old-session" })
            // Bring to playing so STOP works, then start fresh session
            const ctx2 = dispatch(ctx1, { type: "MANIFEST_LOADED", sessionId: "old-session", manifest: mockManifest })
            const ctx3 = dispatch(ctx2, { type: "STOP", sessionId: "old-session" })
            const ctx4 = dispatch(ctx3, { type: "STOPPED", sessionId: "old-session" })
            const ctx5 = dispatch(ctx4, { type: "START", albumId: "album-456", sessionId: "new-session" })
            // Old manifest response arrives
            const ctx6 = dispatch(ctx5, { type: "MANIFEST_LOADED", sessionId: "old-session", manifest: mockManifest })
            expect(ctx6.state.kind).toBe("loading")
            expect(ctx6.lastSessionId).toBe("new-session")
        })

        it("fails when manifest has no tracks", () => {
            const ctx1 = dispatch(createInitialContext(), { type: "START", albumId: "album-123", sessionId: TEST_SESSION_ID })
            const ctx2 = dispatch(ctx1, {
                type: "MANIFEST_LOADED",
                sessionId: TEST_SESSION_ID,
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
            const ctx1 = dispatch(createInitialContext(), { type: "START", albumId: "album-123", sessionId: TEST_SESSION_ID })
            const ctx2 = dispatch(ctx1, { type: "MANIFEST_FAILED", sessionId: TEST_SESSION_ID, error: "Network error" })
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
            const ctx1 = dispatch(createInitialContext(), { type: "START", albumId: "album-123", sessionId: TEST_SESSION_ID })
            const ctx2 = dispatch(ctx1, { type: "PLAY", sessionId: TEST_SESSION_ID })
            expect(ctx2.state.kind).toBe("loading")
        })

        it("is ignored when not loading", () => {
            const ctx = dispatch(createInitialContext(), { type: "PLAY", sessionId: "any" })
            expect(ctx.state.kind).toBe("idle")
        })
    })

    describe("PAUSE / RESUME", () => {
        it("transitions playing -> paused", () => {
            const ctx1 = dispatch(createInitialContext(), { type: "START", albumId: "album-123", sessionId: TEST_SESSION_ID })
            const ctx2 = dispatch(ctx1, { type: "MANIFEST_LOADED", sessionId: TEST_SESSION_ID, manifest: mockManifest })
            const ctx3 = dispatch(ctx2, { type: "PAUSE", sessionId: TEST_SESSION_ID })
            expect(ctx3.state.kind).toBe("paused")
            expect(ctx3.lastToggleAt).toBeGreaterThan(0)
        })

        it("transitions paused -> playing", () => {
            const ctx1 = dispatch(createInitialContext(), { type: "START", albumId: "album-123", sessionId: TEST_SESSION_ID })
            const ctx2 = dispatch(ctx1, { type: "MANIFEST_LOADED", sessionId: TEST_SESSION_ID, manifest: mockManifest })
            const ctx3 = dispatch(ctx2, { type: "PAUSE", sessionId: TEST_SESSION_ID })
            // Advance time past toggle guard
            vi.advanceTimersByTime(100)
            const ctx4 = dispatch(ctx3, { type: "RESUME", sessionId: TEST_SESSION_ID })
            expect(ctx4.state.kind).toBe("playing")
        })

        it("guards against rapid pause/resume", () => {
            const ctx1 = dispatch(createInitialContext(), { type: "START", albumId: "album-123", sessionId: TEST_SESSION_ID })
            const ctx2 = dispatch(ctx1, { type: "MANIFEST_LOADED", sessionId: TEST_SESSION_ID, manifest: mockManifest })
            const ctx3 = dispatch(ctx2, { type: "PAUSE", sessionId: TEST_SESSION_ID })
            // Immediate resume should be blocked
            const ctx4 = dispatch(ctx3, { type: "RESUME", sessionId: TEST_SESSION_ID })
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
            const ctx1 = dispatch(createInitialContext(), { type: "START", albumId: "album-123", sessionId: TEST_SESSION_ID })
            const ctx2 = dispatch(ctx1, { type: "MANIFEST_LOADED", sessionId: TEST_SESSION_ID, manifest: mockManifest })
            const ctx3 = dispatch(ctx2, { type: "TRACK_ENDED", sessionId: TEST_SESSION_ID, trackIndex: 0 })
            expect(ctx3.state.kind).toBe("playing")
            expect(ctx3.state).toMatchObject({
                currentTrackIndex: 1,
                currentTime: 0,
            })
            expect(ctx3.completedTracks.has(0)).toBe(true)
        })

        it("completes album on final track", () => {
            const singleTrackManifest = { ...mockManifest, tracks: [mockManifest.tracks[0]] }
            const ctx1 = dispatch(createInitialContext(), { type: "START", albumId: "album-123", sessionId: TEST_SESSION_ID })
            const ctx2 = dispatch(ctx1, { type: "MANIFEST_LOADED", sessionId: TEST_SESSION_ID, manifest: singleTrackManifest })
            const ctx3 = dispatch(ctx2, { type: "TRACK_ENDED", sessionId: TEST_SESSION_ID, trackIndex: 0 })
            expect(ctx3.state.kind).toBe("completed")
            expect(ctx3.completedTracks.has(0)).toBe(true)
        })

        it("guards against duplicate ended for same track", () => {
            const ctx1 = dispatch(createInitialContext(), { type: "START", albumId: "album-123", sessionId: TEST_SESSION_ID })
            const ctx2 = dispatch(ctx1, { type: "MANIFEST_LOADED", sessionId: TEST_SESSION_ID, manifest: mockManifest })
            const ctx3 = dispatch(ctx2, { type: "TRACK_ENDED", sessionId: TEST_SESSION_ID, trackIndex: 0 })
            const ctx4 = dispatch(ctx3, { type: "TRACK_ENDED", sessionId: TEST_SESSION_ID, trackIndex: 0 })
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
            const ctx1 = dispatch(createInitialContext(), { type: "START", albumId: "album-123", sessionId: TEST_SESSION_ID })
            const ctx2 = dispatch(ctx1, { type: "MANIFEST_LOADED", sessionId: TEST_SESSION_ID, manifest: mockManifest })
            const ctx3 = dispatch(ctx2, { type: "TIME_UPDATE", sessionId: TEST_SESSION_ID, currentTime: 42, trackDuration: 120 })
            expect(ctx3.state).toMatchObject({
                currentTime: 42,
                trackDuration: 120,
            })
        })

        it("updates during paused", () => {
            const ctx1 = dispatch(createInitialContext(), { type: "START", albumId: "album-123", sessionId: TEST_SESSION_ID })
            const ctx2 = dispatch(ctx1, { type: "MANIFEST_LOADED", sessionId: TEST_SESSION_ID, manifest: mockManifest })
            const ctx3 = dispatch(ctx2, { type: "PAUSE", sessionId: TEST_SESSION_ID })
            const ctx4 = dispatch(ctx3, { type: "TIME_UPDATE", sessionId: TEST_SESSION_ID, currentTime: 15, trackDuration: null })
            expect(ctx4.state).toMatchObject({ currentTime: 15 })
        })

        it("ignores when idle", () => {
            const ctx = dispatch(createInitialContext(), { type: "TIME_UPDATE", sessionId: "any", currentTime: 10, trackDuration: 100 })
            expect(ctx.state.kind).toBe("idle")
        })
    })

    describe("AUDIO_ERROR", () => {
        it("transitions playing -> recoverable-error", () => {
            const ctx1 = dispatch(createInitialContext(), { type: "START", albumId: "album-123", sessionId: TEST_SESSION_ID })
            const ctx2 = dispatch(ctx1, { type: "MANIFEST_LOADED", sessionId: TEST_SESSION_ID, manifest: mockManifest })
            const ctx3 = dispatch(ctx2, { type: "AUDIO_ERROR", sessionId: TEST_SESSION_ID, error: "Network timeout", recoverable: true })
            expect(ctx3.state.kind).toBe("recoverable-error")
            expect(ctx3.state).toMatchObject({
                currentTrackIndex: 0,
                currentTime: 0,
                error: "Network timeout",
            })
        })

        it("transitions playing -> terminal-error", () => {
            const ctx1 = dispatch(createInitialContext(), { type: "START", albumId: "album-123", sessionId: TEST_SESSION_ID })
            const ctx2 = dispatch(ctx1, { type: "MANIFEST_LOADED", sessionId: TEST_SESSION_ID, manifest: mockManifest })
            const ctx3 = dispatch(ctx2, { type: "AUDIO_ERROR", sessionId: TEST_SESSION_ID, error: "Unsupported codec", recoverable: false })
            expect(ctx3.state.kind).toBe("terminal-error")
        })

        it("handles error during loading", () => {
            const ctx1 = dispatch(createInitialContext(), { type: "START", albumId: "album-123", sessionId: TEST_SESSION_ID })
            const ctx2 = dispatch(ctx1, { type: "AUDIO_ERROR", sessionId: TEST_SESSION_ID, error: "Load failed", recoverable: true })
            expect(ctx2.state.kind).toBe("recoverable-error")
        })

        it("ignores when stale", () => {
            const ctx = dispatch(createInitialContext(), { type: "AUDIO_ERROR", sessionId: "old", error: "oops", recoverable: true })
            expect(ctx.state.kind).toBe("idle")
        })
    })

    describe("STOP / STOPPED", () => {
        it("transitions playing -> stopping", () => {
            const ctx1 = dispatch(createInitialContext(), { type: "START", albumId: "album-123", sessionId: TEST_SESSION_ID })
            const ctx2 = dispatch(ctx1, { type: "MANIFEST_LOADED", sessionId: TEST_SESSION_ID, manifest: mockManifest })
            const ctx3 = dispatch(ctx2, { type: "STOP", sessionId: TEST_SESSION_ID })
            expect(ctx3.state.kind).toBe("stopping")
        })

        it("transitions stopping -> idle", () => {
            const ctx1 = dispatch(createInitialContext(), { type: "START", albumId: "album-123", sessionId: TEST_SESSION_ID })
            const ctx2 = dispatch(ctx1, { type: "MANIFEST_LOADED", sessionId: TEST_SESSION_ID, manifest: mockManifest })
            const ctx3 = dispatch(ctx2, { type: "STOP", sessionId: TEST_SESSION_ID })
            const ctx4 = dispatch(ctx3, { type: "STOPPED", sessionId: TEST_SESSION_ID })
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
            const ctx1 = dispatch(createInitialContext(), { type: "START", albumId: "album-123", sessionId: TEST_SESSION_ID })
            const ctx2 = dispatch(ctx1, { type: "MANIFEST_LOADED", sessionId: TEST_SESSION_ID, manifest: mockManifest })
            const ctx3 = dispatch(ctx2, { type: "AUDIO_ERROR", sessionId: TEST_SESSION_ID, error: "oops", recoverable: true })
            const ctx4 = dispatch(ctx3, { type: "RETRY", sessionId: TEST_SESSION_ID })
            expect(ctx4.state.kind).toBe("playing")
        })

        it("ignores when not in recoverable-error", () => {
            const ctx = dispatch(createInitialContext(), { type: "RETRY", sessionId: "any" })
            expect(ctx.state.kind).toBe("idle")
        })
    })

    describe("RESTART", () => {
        it("restarts from playing", () => {
            const ctx1 = dispatch(createInitialContext(), { type: "START", albumId: "album-123", sessionId: TEST_SESSION_ID })
            const ctx2 = dispatch(ctx1, { type: "MANIFEST_LOADED", sessionId: TEST_SESSION_ID, manifest: mockManifest })
            const ctx3 = dispatch(ctx2, { type: "TRACK_ENDED", sessionId: TEST_SESSION_ID, trackIndex: 0 })
            const ctx4 = dispatch(ctx3, { type: "RESTART", sessionId: TEST_SESSION_ID })
            expect(ctx4.state.kind).toBe("playing")
            expect(ctx4.state).toMatchObject({
                currentTrackIndex: 0,
                currentTime: 0,
            })
            expect(ctx4.completedTracks.size).toBe(0)
        })

        it("restarts from completed", () => {
            const singleTrackManifest = { ...mockManifest, tracks: [mockManifest.tracks[0]] }
            const ctx1 = dispatch(createInitialContext(), { type: "START", albumId: "album-123", sessionId: TEST_SESSION_ID })
            const ctx2 = dispatch(ctx1, { type: "MANIFEST_LOADED", sessionId: TEST_SESSION_ID, manifest: singleTrackManifest })
            const ctx3 = dispatch(ctx2, { type: "TRACK_ENDED", sessionId: TEST_SESSION_ID, trackIndex: 0 })
            const ctx4 = dispatch(ctx3, { type: "RESTART", sessionId: TEST_SESSION_ID })
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
            const ctx1 = dispatch(createInitialContext(), { type: "START", albumId: "album-123", sessionId: TEST_SESSION_ID })
            const ctx2 = dispatch(ctx1, { type: "MANIFEST_FAILED", sessionId: TEST_SESSION_ID, error: "oops" })
            const ctx3 = dispatch(ctx2, { type: "DISMISS_ERROR", sessionId: TEST_SESSION_ID })
            expect(ctx3.state.kind).toBe("idle")
            expect(ctx3.lastSessionId).toBeNull()
        })

        it("transitions completed -> idle", () => {
            const singleTrackManifest = { ...mockManifest, tracks: [mockManifest.tracks[0]] }
            const ctx1 = dispatch(createInitialContext(), { type: "START", albumId: "album-123", sessionId: TEST_SESSION_ID })
            const ctx2 = dispatch(ctx1, { type: "MANIFEST_LOADED", sessionId: TEST_SESSION_ID, manifest: singleTrackManifest })
            const ctx3 = dispatch(ctx2, { type: "TRACK_ENDED", sessionId: TEST_SESSION_ID, trackIndex: 0 })
            const ctx4 = dispatch(ctx3, { type: "DISMISS_ERROR", sessionId: TEST_SESSION_ID })
            expect(ctx4.state.kind).toBe("idle")
        })

        it("ignores when idle", () => {
            const ctx = dispatch(createInitialContext(), { type: "DISMISS_ERROR", sessionId: "any" })
            expect(ctx.state.kind).toBe("idle")
        })
    })

    describe("stale session protection", () => {
        it("ignores all actions for old sessionId", () => {
            // Transition through playing so STOP works
            const ctx1 = dispatch(createInitialContext(), { type: "START", albumId: "album-123", sessionId: "old-session" })
            const ctx2 = dispatch(ctx1, { type: "MANIFEST_LOADED", sessionId: "old-session", manifest: mockManifest })
            const oldSessionId = "old-session"

            // Stop and start new session
            const ctx3 = dispatch(ctx2, { type: "STOP", sessionId: oldSessionId })
            const ctx4 = dispatch(ctx3, { type: "STOPPED", sessionId: oldSessionId })
            const ctx5 = dispatch(ctx4, { type: "START", albumId: "album-456", sessionId: "new-session" })
            const newSessionId = "new-session"

            // Old session actions should be ignored
            const ctx6 = dispatch(ctx5, { type: "PAUSE", sessionId: oldSessionId })
            expect(ctx6.state.kind).toBe("loading")
            expect(ctx6.lastSessionId).toBe(newSessionId)

            const ctx7 = dispatch(ctx6, { type: "TRACK_ENDED", sessionId: oldSessionId, trackIndex: 0 })
            expect(ctx7.state.kind).toBe("loading")
        })
    })

    describe("RECOVER", () => {
        it("transitions idle -> paused with recovered state", () => {
            const ctx = dispatch(createInitialContext(), {
                type: "RECOVER",
                sessionId: "recover-session",
                albumId: "album-123",
                manifest: mockManifest,
                currentTrackIndex: 1,
                currentTime: 42,
            })
            expect(ctx.state.kind).toBe("paused")
            expect(ctx.state).toMatchObject({
                sessionId: "recover-session",
                albumId: "album-123",
                currentTrackIndex: 1,
                currentTime: 42,
                trackDuration: 100,
            })
            expect(ctx.lastSessionId).toBe("recover-session")
            expect(ctx.completedTracks.size).toBe(0)
        })

        it("caps track index to valid range", () => {
            const ctx = dispatch(createInitialContext(), {
                type: "RECOVER",
                sessionId: "recover-session",
                albumId: "album-123",
                manifest: mockManifest,
                currentTrackIndex: 99,
                currentTime: 42,
            })
            expect(ctx.state).toMatchObject({
                currentTrackIndex: 2,
                currentTime: 42,
            })
        })

        it("rejects negative currentTime", () => {
            const ctx = dispatch(createInitialContext(), {
                type: "RECOVER",
                sessionId: "recover-session",
                albumId: "album-123",
                manifest: mockManifest,
                currentTrackIndex: 0,
                currentTime: -10,
            })
            expect(ctx.state).toMatchObject({
                currentTime: 0,
            })
        })

        it("ignores when not idle", () => {
            const ctx1 = dispatch(createInitialContext(), { type: "START", albumId: "album-123", sessionId: TEST_SESSION_ID })
            const ctx2 = dispatch(ctx1, {
                type: "RECOVER",
                sessionId: "recover-session",
                albumId: "album-456",
                manifest: mockManifest,
                currentTrackIndex: 0,
                currentTime: 0,
            })
            expect(ctx2.state.kind).toBe("loading")
        })

        it("ignores when manifest has no tracks", () => {
            const ctx = dispatch(createInitialContext(), {
                type: "RECOVER",
                sessionId: "recover-session",
                albumId: "album-123",
                manifest: { ...mockManifest, tracks: [] },
                currentTrackIndex: 0,
                currentTime: 0,
            })
            expect(ctx.state.kind).toBe("idle")
        })
    })
})

describe("createRecoveryRecord", () => {
    it("creates a record with version and timestamp", () => {
        const record = createRecoveryRecord("s1", "a1", mockManifest, 1, 30)
        expect(record.version).toBe(1)
        expect(record.sessionId).toBe("s1")
        expect(record.albumId).toBe("a1")
        expect(record.currentTrackIndex).toBe(1)
        expect(record.currentTime).toBe(30)
        expect(record.timestamp).toBeGreaterThan(0)
    })
})

describe("isRecoveryRecordValid", () => {
    it("accepts a valid record", () => {
        const record = createRecoveryRecord("s1", "a1", mockManifest, 1, 30)
        expect(isRecoveryRecordValid(record)).toBe(true)
    })

    it("rejects null", () => {
        expect(isRecoveryRecordValid(null)).toBe(false)
    })

    it("rejects wrong version", () => {
        const record = { ...createRecoveryRecord("s1", "a1", mockManifest, 1, 30), version: 2 }
        expect(isRecoveryRecordValid(record)).toBe(false)
    })

    it("rejects missing albumId", () => {
        const record = { ...createRecoveryRecord("s1", "a1", mockManifest, 1, 30), albumId: "" }
        expect(isRecoveryRecordValid(record)).toBe(false)
    })

    it("rejects expired record (>24h)", () => {
        const record = createRecoveryRecord("s1", "a1", mockManifest, 1, 30)
        const expired = { ...record, timestamp: record.timestamp - 25 * 60 * 60 * 1000 }
        expect(isRecoveryRecordValid(expired)).toBe(false)
    })

    it("rejects negative currentTrackIndex", () => {
        const record = { ...createRecoveryRecord("s1", "a1", mockManifest, 1, 30), currentTrackIndex: -1 }
        expect(isRecoveryRecordValid(record)).toBe(false)
    })

    it("rejects NaN currentTime", () => {
        const record = { ...createRecoveryRecord("s1", "a1", mockManifest, 1, 30), currentTime: NaN }
        expect(isRecoveryRecordValid(record)).toBe(false)
    })

    it("rejects manifest without tracks", () => {
        const record = createRecoveryRecord("s1", "a1", { ...mockManifest, tracks: [] }, 0, 0)
        expect(isRecoveryRecordValid(record)).toBe(false)
    })

    it("rejects missing manifest", () => {
        const record = { ...createRecoveryRecord("s1", "a1", mockManifest, 1, 30), manifest: undefined }
        expect(isRecoveryRecordValid(record)).toBe(false)
    })
})

describe("isManifestCompatible", () => {
    it("returns true for identical manifests", () => {
        expect(isManifestCompatible(mockManifest, mockManifest)).toBe(true)
    })

    it("returns false for different albumId", () => {
        const other = { ...mockManifest, albumId: "other" }
        expect(isManifestCompatible(mockManifest, other)).toBe(false)
    })

    it("returns false for different track count", () => {
        const shorter = { ...mockManifest, tracks: mockManifest.tracks.slice(0, 2) }
        expect(isManifestCompatible(mockManifest, shorter)).toBe(false)
    })

    it("returns false for different track order", () => {
        const reordered = {
            ...mockManifest,
            tracks: [mockManifest.tracks[1], mockManifest.tracks[0], mockManifest.tracks[2]],
        }
        expect(isManifestCompatible(mockManifest, reordered)).toBe(false)
    })

    it("returns false for different opaqueTrackId", () => {
        const changed = {
            ...mockManifest,
            tracks: mockManifest.tracks.map((t, i) =>
                i === 1 ? { ...t, opaqueTrackId: "different" } : t
            ),
        }
        expect(isManifestCompatible(mockManifest, changed)).toBe(false)
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