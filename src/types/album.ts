import type { RoleId } from "../domain/roles"

import type {
    RoleHistoryEntry,
} from "../domain/album/roleHistory"

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
    | "digital"
    | "random-discovery"
    | "life-phase"
    | "completion"
    | "collection-essential"
    | "unknown"
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
    | "unknown"
    | "other"

export interface AlbumStory {
    acquiredBecause?: AlbumAcquisitionReason
    lifePhase?: AlbumLifePhase
    memoryNote?: string
    createdAt: string
    updatedAt: string
}

export interface Album {

    id: string

    title: string

    artist: string

    year: string

    coverUrl?: string

    coverOverride?: CoverOverride

    category?: RoleId

    /**
     * History of role assignments.
     */
    roleHistory: RoleHistoryEntry[]

    listenCount: number

    lastListened: string | null

    story?: AlbumStory

    /** Server creation timestamp used for stable newest-first Library ordering. */
    createdAt?: string

}
