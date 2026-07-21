import { describe, it, expect } from "vitest"
import type { PlaybackManifest } from "../../../services/api/playbackService.js"
import type { AlbumSessionState } from "../albumSessionState.js"
import {
    getTrackBoundaries,
    getTrackContext,
    getElapsedAlbumTime,
    formatAlbumTime,
    getTotalAlbumDuration,
    isDiscBoundary,
} from "../trackTimeline.js"

function makeManifest(overrides: Partial<PlaybackManifest> = {}): PlaybackManifest {
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
                mediaType: "mp3",
                playable: true,
                _sourcePath: "/music/t1.mp3",
            },
            {
                opaqueTrackId: "t2",
                discNumber: 1,
                trackNumber: 2,
                title: "Track Two",
                duration: 200,
                mediaType: "mp3",
                playable: true,
                _sourcePath: "/music/t2.mp3",
            },
            {
                opaqueTrackId: "t3",
                discNumber: 1,
                trackNumber: 3,
                title: "Track Three",
                duration: 220,
                mediaType: "mp3",
                playable: true,
                _sourcePath: "/music/t3.mp3",
            },
        ],
        orderingDiagnostic: "ok",
        ...overrides,
    }
}

function makePlayingState(overrides: Partial<Extract<AlbumSessionState, { kind: "playing" }>> = {}): AlbumSessionState {
    const manifest = makeManifest()
    return {
        kind: "playing",
        sessionId: "s1",
        albumId: "album-1",
        manifest,
        currentTrackIndex: 0,
        currentTime: 30,
        trackDuration: 180,
        ...overrides,
    }
}

describe("getTrackBoundaries", () => {
    it("calculates cumulative percentages for each track", () => {
        const manifest = makeManifest()
        const boundaries = getTrackBoundaries(manifest)

        expect(boundaries).toHaveLength(3)
        expect(boundaries[0]).toMatchObject({
            trackIndex: 0,
            startPercent: 0,
            endPercent: 30, // 180/600
            title: "Track One",
        })
        expect(boundaries[1]).toMatchObject({
            trackIndex: 1,
            startPercent: 30,
            endPercent: 63.33333333333333, // 180+200 / 600
            title: "Track Two",
        })
        expect(boundaries[2]).toMatchObject({
            trackIndex: 2,
            startPercent: 63.33333333333333,
            endPercent: 100,
            title: "Track Three",
        })
    })

    it("falls back to uniform distribution when total duration is zero", () => {
        const manifest = makeManifest({
            totalDuration: 0,
            tracks: makeManifest().tracks.map((t) => ({ ...t, duration: 0 })),
        })
        const boundaries = getTrackBoundaries(manifest)

        expect(boundaries).toHaveLength(3)
        expect(boundaries[0].startPercent).toBe(0)
        expect(boundaries[0].endPercent).toBeCloseTo(33.33, 1)
        expect(boundaries[1].startPercent).toBeCloseTo(33.33, 1)
        expect(boundaries[1].endPercent).toBeCloseTo(66.67, 1)
        expect(boundaries[2].startPercent).toBeCloseTo(66.67, 1)
        expect(boundaries[2].endPercent).toBe(100)
    })

    it("handles empty track list", () => {
        const manifest = makeManifest({ tracks: [], totalDuration: 0 })
        expect(getTrackBoundaries(manifest)).toEqual([])
    })

    it("respects multi-disc boundaries", () => {
        const manifest = makeManifest({
            totalDuration: 600,
            tracks: [
                {
                    opaqueTrackId: "t1",
                    discNumber: 1,
                    trackNumber: 1,
                    title: "Disc 1 Track",
                    duration: 180,
                    mediaType: "mp3",
                    playable: true,
                    _sourcePath: "/music/t1.mp3",
                },
                {
                    opaqueTrackId: "t2",
                    discNumber: 2,
                    trackNumber: 1,
                    title: "Disc 2 Track",
                    duration: 200,
                    mediaType: "mp3",
                    playable: true,
                    _sourcePath: "/music/t2.mp3",
                },
                {
                    opaqueTrackId: "t3",
                    discNumber: 2,
                    trackNumber: 2,
                    title: "Disc 2 Track 2",
                    duration: 220,
                    mediaType: "mp3",
                    playable: true,
                    _sourcePath: "/music/t3.mp3",
                },
            ],
        })

        const boundaries = getTrackBoundaries(manifest)
        expect(boundaries[1].discNumber).toBe(2)
        expect(isDiscBoundary(boundaries, 1)).toBe(true)
        expect(isDiscBoundary(boundaries, 0)).toBe(false)
        expect(isDiscBoundary(boundaries, 2)).toBe(false)
    })

    it("caps endPercent at 100", () => {
        const manifest = makeManifest({
            totalDuration: 500,
            tracks: [
                { ...makeManifest().tracks[0], duration: 300 },
                { ...makeManifest().tracks[1], duration: 300 },
            ],
        })
        const boundaries = getTrackBoundaries(manifest)
        expect(boundaries[boundaries.length - 1].endPercent).toBe(100)
    })
})

describe("getTrackContext", () => {
    it("returns null for non-playing states", () => {
        expect(getTrackContext({ kind: "idle" })).toBeNull()
        expect(getTrackContext({ kind: "loading", sessionId: "s1", albumId: "a1" })).toBeNull()
        expect(getTrackContext({ kind: "stopping", sessionId: "s1" })).toBeNull()
        // completed and terminal-error also return null because they lack currentTrackIndex/currentTime
        const manifest = makeManifest()
        const completed: AlbumSessionState = { kind: "completed", sessionId: "s1", albumId: "a1", manifest }
        expect(getTrackContext(completed)).toBeNull()
        const terminal: AlbumSessionState = { kind: "terminal-error", sessionId: "s1", albumId: "a1", error: "fail" }
        expect(getTrackContext(terminal)).toBeNull()
    })

    it("returns 1-based current index and total for playing state", () => {
        const state = makePlayingState({ currentTrackIndex: 1 })
        const ctx = getTrackContext(state)
        expect(ctx).toEqual({
            current: 2,
            total: 3,
            title: "Track Two",
        })
    })

    it("works for paused and recoverable-error states", () => {
        const manifest = makeManifest()
        const paused: AlbumSessionState = {
            kind: "paused",
            sessionId: "s1",
            albumId: "a1",
            manifest,
            currentTrackIndex: 2,
            currentTime: 10,
            trackDuration: 220,
        }
        expect(getTrackContext(paused)).toEqual({
            current: 3,
            total: 3,
            title: "Track Three",
        })

        const error: AlbumSessionState = {
            kind: "recoverable-error",
            sessionId: "s1",
            albumId: "a1",
            manifest,
            currentTrackIndex: 0,
            currentTime: 5,
            trackDuration: 180,
            error: "network",
        }
        expect(getTrackContext(error)).toEqual({
            current: 1,
            total: 3,
            title: "Track One",
        })
    })

    it("returns null when current track index is out of bounds", () => {
        const state = makePlayingState({ currentTrackIndex: 99 })
        expect(getTrackContext(state)).toBeNull()
    })
})

describe("getElapsedAlbumTime", () => {
    it("returns 0 for non-playing states", () => {
        expect(getElapsedAlbumTime({ kind: "idle" })).toBe(0)
    })

    it("sums completed tracks plus current time", () => {
        const state = makePlayingState({ currentTrackIndex: 1, currentTime: 50 })
        // Track 0: 180s + Track 1: 50s = 230s
        expect(getElapsedAlbumTime(state)).toBe(230)
    })

    it("caps current time at track duration", () => {
        const state = makePlayingState({ currentTrackIndex: 0, currentTime: 999 })
        expect(getElapsedAlbumTime(state)).toBe(180)
    })

    it("uses trackDuration fallback when manifest duration is null", () => {
        const manifest = makeManifest({
            tracks: [
                { ...makeManifest().tracks[0], duration: null },
                { ...makeManifest().tracks[1], duration: null },
            ],
        })
        const state: AlbumSessionState = {
            kind: "playing",
            sessionId: "s1",
            albumId: "a1",
            manifest,
            currentTrackIndex: 1,
            currentTime: 30,
            trackDuration: 200,
        }
        // Track 0: fallback 200 + Track 1: min(30, 200) = 230
        expect(getElapsedAlbumTime(state)).toBe(230)
    })
})

describe("formatAlbumTime", () => {
    it('formats seconds as "m:ss"', () => {
        expect(formatAlbumTime(0)).toBe("0:00")
        expect(formatAlbumTime(59)).toBe("0:59")
        expect(formatAlbumTime(60)).toBe("1:00")
        expect(formatAlbumTime(125)).toBe("2:05")
    })

    it('formats hours as "h:mm:ss"', () => {
        expect(formatAlbumTime(3600)).toBe("1:00:00")
        expect(formatAlbumTime(3661)).toBe("1:01:01")
        expect(formatAlbumTime(7205)).toBe("2:00:05")
    })

    it("rounds to whole seconds", () => {
        expect(formatAlbumTime(62.7)).toBe("1:03")
        expect(formatAlbumTime(59.4)).toBe("0:59")
    })

    it("handles invalid input", () => {
        expect(formatAlbumTime(-1)).toBe("0:00")
        expect(formatAlbumTime(NaN)).toBe("0:00")
        expect(formatAlbumTime(Infinity)).toBe("0:00")
    })
})

describe("getTotalAlbumDuration", () => {
    it("returns manifest totalDuration when present", () => {
        expect(getTotalAlbumDuration(makeManifest())).toBe(600)
    })

    it("falls back to sum of track durations", () => {
        const manifest = makeManifest({ totalDuration: null })
        expect(getTotalAlbumDuration(manifest)).toBe(600)
    })

    it("uses track duration fallbacks for null durations", () => {
        const manifest = makeManifest({
            totalDuration: null,
            tracks: [
                { ...makeManifest().tracks[0], duration: null },
                { ...makeManifest().tracks[1], duration: 200 },
            ],
        })
        expect(getTotalAlbumDuration(manifest)).toBe(200)
    })
})

describe("isDiscBoundary", () => {
    it("returns false for first track", () => {
        const boundaries = getTrackBoundaries(makeManifest())
        expect(isDiscBoundary(boundaries, 0)).toBe(false)
    })

    it("detects disc change", () => {
        const manifest = makeManifest({
            tracks: [
                { ...makeManifest().tracks[0], discNumber: 1 },
                { ...makeManifest().tracks[0], discNumber: 2 },
            ],
        })
        const boundaries = getTrackBoundaries(manifest)
        expect(isDiscBoundary(boundaries, 1)).toBe(true)
    })

    it("returns false when disc numbers are the same", () => {
        const manifest = makeManifest({
            tracks: [
                { ...makeManifest().tracks[0], discNumber: 1 },
                { ...makeManifest().tracks[0], discNumber: 1 },
            ],
        })
        const boundaries = getTrackBoundaries(manifest)
        expect(isDiscBoundary(boundaries, 1)).toBe(false)
    })

    it("returns false when disc numbers are null", () => {
        const manifest = makeManifest({
            tracks: [
                { ...makeManifest().tracks[0], discNumber: null },
                { ...makeManifest().tracks[0], discNumber: null },
            ],
        })
        const boundaries = getTrackBoundaries(manifest)
        expect(isDiscBoundary(boundaries, 1)).toBe(false)
    })
})