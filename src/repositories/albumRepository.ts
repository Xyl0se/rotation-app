import type { Album, CoverOverride, AlbumStory } from "../types/album"
import type { StorageAdapter } from "../adapters/storageAdapter"
import { STORAGE } from "../config/storage"
import { roles } from "../domain/roles"
import type { RoleHistoryEntry } from "../domain/album/roleHistory"

const VALID_ACQUISITION_REASONS: string[] = [
    "artist",
    "friend-recommendation",
    "specific-song",
    "concert",
    "review",
    "record-store",
    "gift",
    "random-discovery",
    "life-phase",
    "other",
]

const VALID_LIFE_PHASES: string[] = [
    "childhood",
    "school",
    "studies",
    "first-apartment",
    "relationship",
    "breakup",
    "work",
    "travel",
    "family",
    "current",
    "other",
]

export interface AlbumRepository {
    load(): Album[]
    save(albums: Album[]): void
    clear(): void
}

function isString(value: unknown): value is string {
    return typeof value === "string" && value.length > 0
}

function isValidRoleHistoryEntry(entry: unknown): entry is RoleHistoryEntry {
    if (typeof entry !== "object" || entry === null) {
        return false
    }
    const e = entry as Record<string, unknown>
    return (
        isString(e.role) &&
        isString(e.recordedAt) &&
        isString(e.source) &&
        ["coach", "reflection", "archive"].includes(e.source)
    )
}

function isValidCoverOverride(
    override: unknown,
): override is CoverOverride {
    if (typeof override !== "object" || override === null) {
        return false
    }
    const o = override as Record<string, unknown>
    if (o.type === "custom") {
        return (
            isString(o.albumId) &&
            isString(o.blobUrl) &&
            isString(o.fetchedAt) &&
            (o.source === "upload" || o.source === "alternative")
        )
    }
    if (o.type === "url") {
        return (
            isString(o.albumId) &&
            isString(o.url) &&
            isString(o.fetchedAt)
        )
    }
    return false
}

function isValidAlbumStory(story: unknown): story is AlbumStory {
    if (typeof story !== "object" || story === null) {
        return false
    }
    const s = story as Record<string, unknown>

    const acquiredBecauseValid =
        s.acquiredBecause === undefined ||
        (isString(s.acquiredBecause) &&
            VALID_ACQUISITION_REASONS.includes(s.acquiredBecause))

    const lifePhaseValid =
        s.lifePhase === undefined ||
        (isString(s.lifePhase) &&
            VALID_LIFE_PHASES.includes(s.lifePhase))

    const memoryNoteValid =
        s.memoryNote === undefined ||
        (typeof s.memoryNote === "string" && s.memoryNote.length >= 0)

    const createdAtValid = isString(s.createdAt) && !isNaN(Date.parse(s.createdAt))
    const updatedAtValid = isString(s.updatedAt) && !isNaN(Date.parse(s.updatedAt))

    return (
        acquiredBecauseValid &&
        lifePhaseValid &&
        memoryNoteValid &&
        createdAtValid &&
        updatedAtValid
    )
}

function normalizeAlbum(raw: unknown): Album | null {
    if (typeof raw !== "object" || raw === null) {
        return null
    }
    const r = raw as Record<string, unknown>

    if (!isString(r.id) || !isString(r.title) || !isString(r.artist)) {
        return null
    }

    const validRoles = new Set<string>(roles.map(role => role.id))
    const category: Album["category"] =
        isString(r.category) && validRoles.has(r.category)
            ? (r.category as Album["category"])
            : undefined

    const coverOverride =
        isValidCoverOverride(r.coverOverride) ? r.coverOverride : undefined

    const roleHistory = Array.isArray(r.roleHistory)
        ? r.roleHistory.filter(isValidRoleHistoryEntry)
        : []

    const listenCount =
        typeof r.listenCount === "number" && Number.isFinite(r.listenCount)
            ? Math.max(0, Math.floor(r.listenCount))
            : 0

    const lastListened =
        isString(r.lastListened) && !isNaN(Date.parse(r.lastListened))
            ? r.lastListened
            : null

    const story =
        isValidAlbumStory(r.story) ? r.story : undefined

    return {
        id: r.id,
        title: r.title,
        artist: r.artist,
        year: isString(r.year) ? r.year : "",
        coverUrl: isString(r.coverUrl) ? r.coverUrl : undefined,
        coverOverride,
        category,
        roleHistory,
        listenCount,
        lastListened,
        story,
    }
}

export function createAlbumRepository(
    adapter: StorageAdapter,
    key: string = STORAGE.LIBRARY,
): AlbumRepository {
    return {
        load(): Album[] {
            const raw = adapter.get(key)
            if (!raw) {
                return []
            }
            try {
                const parsed = JSON.parse(raw) as unknown[]
                if (Array.isArray(parsed)) {
                    return parsed
                        .map(normalizeAlbum)
                        .filter((a): a is Album => a !== null)
                }
            } catch {
                // ignore
            }
            return []
        },
        save(albums: Album[]): void {
            adapter.set(key, JSON.stringify(albums))
        },
        clear(): void {
            adapter.remove(key)
        },
    }
}
