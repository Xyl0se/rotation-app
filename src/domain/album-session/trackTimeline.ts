import type { PlaybackManifest } from "../../services/api/playbackService.js"
import type { AlbumSessionState } from "./albumSessionState.js"

export interface TrackBoundary {
    trackIndex: number
    startPercent: number
    endPercent: number
    discNumber: number | null
    trackNumber: number | null
    title: string
}

export interface TrackContext {
    current: number
    total: number
    title: string
}

/**
 * Calculate cumulative start times for each track.
 * Falls back to the runtime audio duration when manifest duration is unknown.
 */
export function getTrackBoundaries(manifest: PlaybackManifest): TrackBoundary[] {
    const tracks = manifest.tracks
    if (tracks.length === 0) return []

    const total = manifest.totalDuration ?? tracks.reduce((sum, t) => sum + (t.duration ?? 0), 0)
    if (total <= 0) {
        // Uniform distribution when no durations are known
        const perTrack = 100 / tracks.length
        return tracks.map((track, index) => ({
            trackIndex: index,
            startPercent: index * perTrack,
            endPercent: (index + 1) * perTrack,
            discNumber: track.discNumber,
            trackNumber: track.trackNumber,
            title: track.title,
        }))
    }

    let cumulative = 0
    const boundaries: TrackBoundary[] = []

    for (let i = 0; i < tracks.length; i++) {
        const track = tracks[i]
        const duration = track.duration ?? 0
        const startPercent = (cumulative / total) * 100
        cumulative += duration
        const endPercent = (cumulative / total) * 100

        boundaries.push({
            trackIndex: i,
            startPercent,
            endPercent: Math.min(endPercent, 100),
            discNumber: track.discNumber,
            trackNumber: track.trackNumber,
            title: track.title,
        })
    }

    return boundaries
}

/**
 * Get the current track context (1-based index, total, title).
 */
export function getTrackContext(state: AlbumSessionState): TrackContext | null {
    if (
        state.kind !== "playing" &&
        state.kind !== "paused" &&
        state.kind !== "recoverable-error"
    ) {
        return null
    }

    const track = state.manifest.tracks[state.currentTrackIndex]
    if (!track) return null

    return {
        current: state.currentTrackIndex + 1,
        total: state.manifest.tracks.length,
        title: track.title,
    }
}

/**
 * Calculate elapsed album time up to the current position.
 * Uses runtime trackDuration as fallback when manifest duration is unknown.
 */
export function getElapsedAlbumTime(state: AlbumSessionState): number {
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

    return elapsed
}

/**
 * Format seconds as mm:ss or h:mm:ss.
 * Never shows false precision — rounds to whole seconds.
 */
export function formatAlbumTime(seconds: number): string {
    if (!Number.isFinite(seconds) || seconds < 0) return "0:00"

    const totalSeconds = Math.round(seconds)
    const h = Math.floor(totalSeconds / 3600)
    const m = Math.floor((totalSeconds % 3600) / 60)
    const s = totalSeconds % 60

    const mm = String(m).padStart(2, "0")
    const ss = String(s).padStart(2, "0")

    if (h > 0) {
        return `${h}:${mm}:${ss}`
    }
    return `${m}:${ss}`
}

/**
 * Get total album duration from manifest, with fallback to sum of track durations.
 */
export function getTotalAlbumDuration(manifest: PlaybackManifest): number {
    return manifest.totalDuration ?? manifest.tracks.reduce((sum, t) => sum + (t.duration ?? 0), 0)
}

/**
 * Check if a track boundary represents a disc boundary (different disc from previous).
 */
export function isDiscBoundary(boundaries: TrackBoundary[], index: number): boolean {
    if (index <= 0) return false
    const current = boundaries[index]
    const previous = boundaries[index - 1]
    if (!current || !previous) return false
    return current.discNumber !== previous.discNumber && current.discNumber !== null && previous.discNumber !== null
}