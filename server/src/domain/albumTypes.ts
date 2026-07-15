/**
 * Server-side album type definitions.
 * Mirrors client-side src/types/album.ts for API compatibility.
 */

export type RoleId =
    | "new"
    | "growing"
    | "comfort-food"
    | "classic"
    | "admire"
    | "archive"

export type CoverOverride =
    | {
        type: "custom"
        source: "upload" | "alternative"
        albumId: string
        blobUrl: string
        fetchedAt: string
    }
    | {
        type: "url"
        albumId: string
        url: string
        fetchedAt: string
    }

export type AlbumAcquisitionReason =
    | "artist"
    | "friend-recommendation"
    | "specific-song"
    | "concert"
    | "review"
    | "record-store"
    | "gift"
    | "random-discovery"
    | "life-phase"
    | "other"

export type AlbumLifePhase =
    | "childhood"
    | "school"
    | "studies"
    | "first-apartment"
    | "relationship"
    | "breakup"
    | "work"
    | "travel"
    | "family"
    | "current"
    | "other"

export interface AlbumStory {
    acquiredBecause?: AlbumAcquisitionReason
    lifePhase?: AlbumLifePhase
    memoryNote?: string
    createdAt: string
    updatedAt: string
}

export interface RoleHistoryEntry {
    role: RoleId
    recordedAt: string
    source: "coach" | "reflection" | "archive"
}

export interface Album {
    id: string
    title: string
    artist: string
    year: string
    coverUrl?: string
    coverOverride?: CoverOverride
    category?: RoleId
    roleHistory: RoleHistoryEntry[]
    listenCount: number
    lastListened: string | null
    story?: AlbumStory
}
