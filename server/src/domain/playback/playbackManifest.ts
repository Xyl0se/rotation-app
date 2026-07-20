export type MediaType = "mp3" | "m4a" | "flac"

export type OrderingDiagnostic =
    | "ok"
    | "missing-track-numbers"
    | "missing-disc-numbers"
    | "duplicate-positions"
    | "filename-fallback-used"

export interface PlaybackTrack {
    opaqueTrackId: string
    discNumber: number | null
    trackNumber: number | null
    title: string
    duration: number | null
    mediaType: MediaType
    playable: boolean
}

export interface PlaybackManifest {
    albumId: string
    title: string
    artist: string
    coverPath: string | null
    totalDuration: number | null
    tracks: PlaybackTrack[]
    orderingDiagnostic: OrderingDiagnostic
}

export interface PlaybackManifestCacheEntry {
    albumId: string
    manifest: PlaybackManifest
    orderingDiagnostic: OrderingDiagnostic
    filenameFallbackUsed: boolean
    cachedAt: string
    invalidatedAt: string | null
}