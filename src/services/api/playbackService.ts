import { get, ApiError } from "./apiClient.js"
import type { PlaybackManifest } from "../../../server/src/domain/playback/playbackManifest.js"

export type { PlaybackManifest }

export async function getPlaybackManifest(albumId: string): Promise<PlaybackManifest> {
    const url = `/playback/manifest/${encodeURIComponent(albumId)}`
    console.log("[playbackService] GET", url)
    try {
        const result = await get<PlaybackManifest>(url)
        console.log("[playbackService] Manifest OK", result.tracks.length, "tracks")
        return result
    } catch (err: unknown) {
        console.error("[playbackService] Manifest FAILED", url, err)
        throw err
    }
}

export function buildMediaUrl(albumId: string, opaqueTrackId: string): string {
    const url = `/api/playback/media/${encodeURIComponent(albumId)}/${encodeURIComponent(opaqueTrackId)}`
    console.log("[playbackService] buildMediaUrl", url)
    return url
}

export function getPlaybackErrorMessage(error: unknown): string {
    if (error instanceof ApiError) {
        if (error.status === 503) {
            return "Album hat mehrdeutige Track-Reihenfolge und kann nicht abgespielt werden."
        }
        if (error.status === 404) {
            return "Album oder Binding nicht gefunden."
        }
        const body = error.body as { error?: string } | null
        return body?.error ?? "Wiedergabe nicht möglich"
    }
    if (error instanceof Error) {
        return error.message
    }
    return "Unbekannter Fehler"
}
