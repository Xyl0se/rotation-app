import type { PlaybackManifest } from "../../services/api/playbackService.js"
import type { PlaybackTrack } from "../../../server/src/domain/playback/playbackManifest.js"

export interface RecoveryRecord {
    version: number
    albumId: string
    manifest: PlaybackManifest
    currentTrackIndex: number
    currentTime: number
    sessionId: string
    timestamp: number
}

export type AlbumSessionState =
    | { kind: "idle" }
    | { kind: "loading"; sessionId: string; albumId: string }
    | {
          kind: "playing"
          sessionId: string
          albumId: string
          manifest: PlaybackManifest
          currentTrackIndex: number
          currentTime: number
          trackDuration: number | null
      }
    | {
          kind: "paused"
          sessionId: string
          albumId: string
          manifest: PlaybackManifest
          currentTrackIndex: number
          currentTime: number
          trackDuration: number | null
      }
    | { kind: "stopping"; sessionId: string }
    | { kind: "completed"; sessionId: string; albumId: string; manifest: PlaybackManifest }
    | {
          kind: "recoverable-error"
          sessionId: string
          albumId: string
          manifest: PlaybackManifest
          currentTrackIndex: number
          currentTime: number
          trackDuration: number | null
          error: string
      }
    | { kind: "terminal-error"; sessionId: string; albumId: string; error: string }

export interface AlbumSessionContext {
    state: AlbumSessionState
    /** Last assigned session ID; used to detect stale async operations */
    lastSessionId: string | null
    /** Timestamp of last Play/Pause toggle to guard against rapid input */
    lastToggleAt: number
    /** Set of track indices that have already fired ended in this session */
    completedTracks: Set<number>
}

export function createInitialContext(): AlbumSessionContext {
    return {
        state: { kind: "idle" },
        lastSessionId: null,
        lastToggleAt: 0,
        completedTracks: new Set(),
    }
}

export function generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

/** Minimum milliseconds between Play/Pause toggles */
const TOGGLE_GUARD_MS = 50

export type AlbumSessionAction =
    | { type: "START"; albumId: string; sessionId?: string }
    | { type: "MANIFEST_LOADED"; sessionId: string; manifest: PlaybackManifest }
    | { type: "MANIFEST_FAILED"; sessionId: string; error: string }
    | { type: "PLAY"; sessionId: string }
    | { type: "PAUSE"; sessionId: string }
    | { type: "RESUME"; sessionId: string }
    | { type: "TRACK_ENDED"; sessionId: string; trackIndex: number }
    | { type: "TIME_UPDATE"; sessionId: string; currentTime: number; trackDuration: number | null }
    | { type: "AUDIO_ERROR"; sessionId: string; error: string; recoverable: boolean }
    | { type: "STOP"; sessionId: string }
    | { type: "STOPPED"; sessionId: string }
    | { type: "RETRY"; sessionId: string }
    | { type: "RESTART"; sessionId: string }
    | { type: "RECOVER"; sessionId: string; albumId: string; manifest: PlaybackManifest; currentTrackIndex: number; currentTime: number }
    | { type: "COMPLETED"; sessionId: string }
    | { type: "DISMISS_ERROR"; sessionId: string }

const RECOVERY_VERSION = 1

/** Maximum age of a recovery record in milliseconds (24 hours) */
const RECOVERY_MAX_AGE_MS = 24 * 60 * 60 * 1000

function isStale(ctx: AlbumSessionContext, sessionId: string): boolean {
    return ctx.lastSessionId !== sessionId
}

function isRapidToggle(ctx: AlbumSessionContext): boolean {
    return Date.now() - ctx.lastToggleAt < TOGGLE_GUARD_MS
}

function trackAlreadyCompleted(ctx: AlbumSessionContext, trackIndex: number): boolean {
    return ctx.completedTracks.has(trackIndex)
}

export function albumSessionReducer(
    ctx: AlbumSessionContext,
    action: AlbumSessionAction
): AlbumSessionContext {
    switch (action.type) {
        case "START": {
            // Guard against double-start while loading or playing
            if (ctx.state.kind === "loading" || ctx.state.kind === "playing") {
                return ctx
            }
            const sessionId = action.sessionId ?? generateSessionId()
            return {
                ...ctx,
                state: { kind: "loading", sessionId, albumId: action.albumId },
                lastSessionId: sessionId,
                lastToggleAt: 0,
                completedTracks: new Set(),
            }
        }

        case "MANIFEST_LOADED": {
            if (isStale(ctx, action.sessionId)) return ctx
            if (ctx.state.kind !== "loading") return ctx
            const manifest = action.manifest
            if (manifest.tracks.length === 0) {
                return {
                    ...ctx,
                    state: {
                        kind: "terminal-error",
                        sessionId: action.sessionId,
                        albumId: ctx.state.albumId,
                        error: "Album enthält keine abspielbaren Tracks.",
                    },
                }
            }
            return {
                ...ctx,
                state: {
                    kind: "playing",
                    sessionId: action.sessionId,
                    albumId: ctx.state.albumId,
                    manifest,
                    currentTrackIndex: 0,
                    currentTime: 0,
                    trackDuration: manifest.tracks[0]?.duration ?? null,
                },
            }
        }

        case "MANIFEST_FAILED": {
            if (isStale(ctx, action.sessionId)) return ctx
            if (ctx.state.kind !== "loading") return ctx
            return {
                ...ctx,
                state: {
                    kind: "terminal-error",
                    sessionId: action.sessionId,
                    albumId: ctx.state.albumId,
                    error: action.error,
                },
            }
        }

        case "PLAY": {
            if (isStale(ctx, action.sessionId)) return ctx
            if (ctx.state.kind !== "loading") return ctx
            if (isRapidToggle(ctx)) return ctx
            // Transition loading -> playing is triggered by MANIFEST_LOADED,
            // PLAY is only valid as a no-op during loading (audio will auto-play)
            return ctx
        }

        case "PAUSE": {
            if (isStale(ctx, action.sessionId)) return ctx
            if (ctx.state.kind !== "playing") return ctx
            if (isRapidToggle(ctx)) return ctx
            return {
                ...ctx,
                state: {
                    kind: "paused",
                    sessionId: action.sessionId,
                    albumId: ctx.state.albumId,
                    manifest: ctx.state.manifest,
                    currentTrackIndex: ctx.state.currentTrackIndex,
                    currentTime: ctx.state.currentTime,
                    trackDuration: ctx.state.trackDuration,
                },
                lastToggleAt: Date.now(),
            }
        }

        case "RESUME": {
            if (isStale(ctx, action.sessionId)) return ctx
            if (ctx.state.kind !== "paused") return ctx
            if (isRapidToggle(ctx)) return ctx
            return {
                ...ctx,
                state: {
                    kind: "playing",
                    sessionId: action.sessionId,
                    albumId: ctx.state.albumId,
                    manifest: ctx.state.manifest,
                    currentTrackIndex: ctx.state.currentTrackIndex,
                    currentTime: ctx.state.currentTime,
                    trackDuration: ctx.state.trackDuration,
                },
                lastToggleAt: Date.now(),
            }
        }

        case "TRACK_ENDED": {
            if (isStale(ctx, action.sessionId)) return ctx
            if (ctx.state.kind !== "playing") return ctx
            // Guard against duplicate ended events for the same track
            if (trackAlreadyCompleted(ctx, action.trackIndex)) return ctx
            const manifest = ctx.state.manifest
            const nextIndex = action.trackIndex + 1
            if (nextIndex >= manifest.tracks.length) {
                // Final track ended
                return {
                    ...ctx,
                    state: {
                        kind: "completed",
                        sessionId: action.sessionId,
                        albumId: ctx.state.albumId,
                        manifest,
                    },
                    completedTracks: new Set([...ctx.completedTracks, action.trackIndex]),
                }
            }
            // Advance to next track
            return {
                ...ctx,
                state: {
                    kind: "playing",
                    sessionId: action.sessionId,
                    albumId: ctx.state.albumId,
                    manifest,
                    currentTrackIndex: nextIndex,
                    currentTime: 0,
                    trackDuration: manifest.tracks[nextIndex]?.duration ?? null,
                },
                completedTracks: new Set([...ctx.completedTracks, action.trackIndex]),
            }
        }

        case "TIME_UPDATE": {
            if (isStale(ctx, action.sessionId)) return ctx
            if (ctx.state.kind !== "playing" && ctx.state.kind !== "paused") return ctx
            return {
                ...ctx,
                state: {
                    ...ctx.state,
                    currentTime: action.currentTime,
                    trackDuration: action.trackDuration ?? ctx.state.trackDuration,
                },
            }
        }

        case "AUDIO_ERROR": {
            if (isStale(ctx, action.sessionId)) return ctx
            if (
                ctx.state.kind !== "playing" &&
                ctx.state.kind !== "paused" &&
                ctx.state.kind !== "loading"
            ) {
                return ctx
            }
            if (action.recoverable) {
                return {
                    ...ctx,
                    state: {
                        kind: "recoverable-error",
                        sessionId: action.sessionId,
                        albumId:
                            ctx.state.kind === "loading"
                                ? ctx.state.albumId
                                : (ctx.state as Extract<AlbumSessionState, { kind: "playing" | "paused" }>).albumId,
                        manifest:
                            ctx.state.kind === "loading"
                                ? null!
                                : (ctx.state as Extract<AlbumSessionState, { kind: "playing" | "paused" }>).manifest,
                        currentTrackIndex:
                            ctx.state.kind === "loading"
                                ? 0
                                : (ctx.state as Extract<AlbumSessionState, { kind: "playing" | "paused" }>).currentTrackIndex,
                        currentTime:
                            ctx.state.kind === "loading"
                                ? 0
                                : (ctx.state as Extract<AlbumSessionState, { kind: "playing" | "paused" }>).currentTime,
                        trackDuration:
                            ctx.state.kind === "loading"
                                ? null
                                : (ctx.state as Extract<AlbumSessionState, { kind: "playing" | "paused" }>).trackDuration,
                        error: action.error,
                    },
                }
            }
            return {
                ...ctx,
                state: {
                    kind: "terminal-error",
                    sessionId: action.sessionId,
                    albumId:
                        ctx.state.kind === "loading"
                            ? ctx.state.albumId
                            : (ctx.state as Extract<AlbumSessionState, { kind: "playing" | "paused" }>).albumId,
                    error: action.error,
                },
            }
        }

        case "STOP": {
            if (isStale(ctx, action.sessionId)) return ctx
            if (
                ctx.state.kind !== "playing" &&
                ctx.state.kind !== "paused" &&
                ctx.state.kind !== "recoverable-error"
            ) {
                return ctx
            }
            return {
                ...ctx,
                state: {
                    kind: "stopping",
                    sessionId: action.sessionId,
                },
            }
        }

        case "STOPPED": {
            if (isStale(ctx, action.sessionId)) return ctx
            if (ctx.state.kind !== "stopping") return ctx
            return {
                ...ctx,
                state: { kind: "idle" },
                lastSessionId: null,
                completedTracks: new Set(),
            }
        }

        case "RETRY": {
            if (isStale(ctx, action.sessionId)) return ctx
            if (ctx.state.kind !== "recoverable-error") return ctx
            return {
                ...ctx,
                state: {
                    kind: "playing",
                    sessionId: action.sessionId,
                    albumId: ctx.state.albumId,
                    manifest: ctx.state.manifest,
                    currentTrackIndex: ctx.state.currentTrackIndex,
                    currentTime: ctx.state.currentTime,
                    trackDuration: ctx.state.trackDuration,
                },
            }
        }

        case "RESTART": {
            if (isStale(ctx, action.sessionId)) return ctx
            if (
                ctx.state.kind !== "playing" &&
                ctx.state.kind !== "paused" &&
                ctx.state.kind !== "recoverable-error" &&
                ctx.state.kind !== "completed"
            ) {
                return ctx
            }
            const albumId =
                ctx.state.kind === "completed"
                    ? ctx.state.albumId
                    : (ctx.state as Extract<AlbumSessionState, { kind: "playing" | "paused" | "recoverable-error" }>).albumId
            const manifest =
                ctx.state.kind === "completed"
                    ? ctx.state.manifest
                    : (ctx.state as Extract<AlbumSessionState, { kind: "playing" | "paused" | "recoverable-error" }>).manifest
            return {
                ...ctx,
                state: {
                    kind: "playing",
                    sessionId: action.sessionId,
                    albumId,
                    manifest,
                    currentTrackIndex: 0,
                    currentTime: 0,
                    trackDuration: manifest.tracks[0]?.duration ?? null,
                },
                completedTracks: new Set(),
            }
        }

        case "COMPLETED": {
            if (isStale(ctx, action.sessionId)) return ctx
            // COMPLETED is a no-op action; completion is reached via TRACK_ENDED of final track
            return ctx
        }

        case "RECOVER": {
            if (ctx.state.kind !== "idle") return ctx
            // Validate that the recovered state is reasonable
            const manifest = action.manifest
            if (!manifest.tracks || manifest.tracks.length === 0) {
                return ctx
            }
            const validTrackIndex = Math.min(
                action.currentTrackIndex,
                manifest.tracks.length - 1
            )
            return {
                ...ctx,
                state: {
                    kind: "paused",
                    sessionId: action.sessionId,
                    albumId: action.albumId,
                    manifest,
                    currentTrackIndex: validTrackIndex,
                    currentTime: Math.max(0, action.currentTime),
                    trackDuration: manifest.tracks[validTrackIndex]?.duration ?? null,
                },
                lastSessionId: action.sessionId,
                lastToggleAt: 0,
                completedTracks: new Set(),
            }
        }

        case "DISMISS_ERROR": {
            if (isStale(ctx, action.sessionId)) return ctx
            if (
                ctx.state.kind !== "terminal-error" &&
                ctx.state.kind !== "recoverable-error" &&
                ctx.state.kind !== "completed"
            ) {
                return ctx
            }
            return {
                ...ctx,
                state: { kind: "idle" },
                lastSessionId: null,
                completedTracks: new Set(),
            }
        }

        default:
            return ctx
    }
}

export function createRecoveryRecord(
    sessionId: string,
    albumId: string,
    manifest: PlaybackManifest,
    currentTrackIndex: number,
    currentTime: number
): RecoveryRecord {
    return {
        version: RECOVERY_VERSION,
        sessionId,
        albumId,
        manifest,
        currentTrackIndex,
        currentTime,
        timestamp: Date.now(),
    }
}

export function isRecoveryRecordValid(record: unknown): record is RecoveryRecord {
    if (!record || typeof record !== "object") return false
    const r = record as Record<string, unknown>

    if (r.version !== RECOVERY_VERSION) return false
    if (typeof r.albumId !== "string" || r.albumId.length === 0) return false
    if (typeof r.sessionId !== "string" || r.sessionId.length === 0) return false
    if (typeof r.timestamp !== "number") return false
    if (Date.now() - r.timestamp > RECOVERY_MAX_AGE_MS) return false

    if (
        typeof r.currentTrackIndex !== "number" ||
        r.currentTrackIndex < 0 ||
        !Number.isFinite(r.currentTrackIndex)
    ) {
        return false
    }
    if (
        typeof r.currentTime !== "number" ||
        r.currentTime < 0 ||
        !Number.isFinite(r.currentTime)
    ) {
        return false
    }

    // Validate manifest shape loosely
    const manifest = r.manifest
    if (!manifest || typeof manifest !== "object") return false
    const m = manifest as Record<string, unknown>
    if (typeof m.albumId !== "string") return false
    if (!Array.isArray(m.tracks)) return false
    if (m.tracks.length === 0) return false

    return true
}

export function isManifestCompatible(
    stored: PlaybackManifest,
    fresh: PlaybackManifest
): boolean {
    if (stored.albumId !== fresh.albumId) return false
    if (stored.tracks.length !== fresh.tracks.length) return false
    // Compare track identities by opaqueTrackId and order
    for (let i = 0; i < stored.tracks.length; i++) {
        const a = stored.tracks[i]
        const b = fresh.tracks[i]
        if (!a || !b) return false
        if (a.opaqueTrackId !== b.opaqueTrackId) return false
    }
    return true
}

export function getCurrentTrack(state: AlbumSessionState): PlaybackTrack | null {
    if (
        state.kind === "playing" ||
        state.kind === "paused" ||
        state.kind === "recoverable-error"
    ) {
        return state.manifest.tracks[state.currentTrackIndex] ?? null
    }
    return null
}

export function getAlbumProgress(state: AlbumSessionState): number {
    if (
        state.kind !== "playing" &&
        state.kind !== "paused" &&
        state.kind !== "recoverable-error"
    ) {
        return 0
    }
    const { manifest, currentTrackIndex, currentTime, trackDuration } = state
    let elapsed = 0
    for (let i = 0; i < currentTrackIndex; i++) {
        elapsed += manifest.tracks[i]?.duration ?? trackDuration ?? 0
    }
    const currentTrackDuration = manifest.tracks[currentTrackIndex]?.duration ?? trackDuration ?? 0
    elapsed += Math.min(currentTime, currentTrackDuration)
    const total = manifest.totalDuration ?? manifest.tracks.reduce((sum, t) => sum + (t.duration ?? 0), 0)
    if (total <= 0) return 0
    return Math.min(1, elapsed / total)
}