import Database from "better-sqlite3"
import type { Album, CoverOverride, AlbumStory, RoleHistoryEntry } from "../../../domain/albumTypes.js"

// --- SnakeCase DB Record ---

interface AlbumRecord {
    id: string
    title: string
    artist: string
    year: string | null
    category: string | null
    cover_url: string | null
    cover_override: string | null
    role_history: string
    listen_count: number
    last_listened: string | null
    story: string | null
    created_at: string
    updated_at: string
}

// --- Normalization (defensive, analogous to client-side albumRepository.ts) ---

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

function isValidCoverOverride(override: unknown): override is CoverOverride {
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
        (isString(s.acquiredBecause))

    const lifePhaseValid =
        s.lifePhase === undefined ||
        (isString(s.lifePhase))

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

function parseRoleHistory(raw: string): RoleHistoryEntry[] {
    try {
        const parsed = JSON.parse(raw) as unknown
        if (Array.isArray(parsed)) {
            return parsed.filter(isValidRoleHistoryEntry)
        }
    } catch {
        // ignore
    }
    return []
}

function parseCoverOverride(raw: string | null): CoverOverride | undefined {
    if (!raw) return undefined
    try {
        const parsed = JSON.parse(raw) as unknown
        if (isValidCoverOverride(parsed)) {
            return parsed
        }
    } catch {
        // ignore
    }
    return undefined
}

function parseAlbumStory(raw: string | null): AlbumStory | undefined {
    if (!raw) return undefined
    try {
        const parsed = JSON.parse(raw) as unknown
        if (isValidAlbumStory(parsed)) {
            return parsed
        }
    } catch {
        // ignore
    }
    return undefined
}

function recordToAlbum(record: AlbumRecord): Album {
    return {
        id: record.id,
        title: record.title,
        artist: record.artist,
        year: record.year ?? "",
        coverUrl: record.cover_url ?? undefined,
        coverOverride: parseCoverOverride(record.cover_override),
        category: record.category === null
            ? undefined
            : record.category as Album["category"],
        roleHistory: parseRoleHistory(record.role_history),
        listenCount: record.listen_count,
        lastListened: record.last_listened,
        story: parseAlbumStory(record.story),
    }
}

function albumToRecord(album: Album): AlbumRecord {
    const now = new Date().toISOString()
    return {
        id: album.id,
        title: album.title,
        artist: album.artist,
        year: album.year || null,
        category: album.category ?? null,
        cover_url: album.coverUrl ?? null,
        cover_override: album.coverOverride ? JSON.stringify(album.coverOverride) : null,
        role_history: JSON.stringify(album.roleHistory),
        listen_count: album.listenCount,
        last_listened: album.lastListened,
        story: album.story ? JSON.stringify(album.story) : null,
        created_at: now,
        updated_at: now,
    }
}

// --- Repository ---

export function createAlbumRepository(db: Database.Database) {
    const insert = db.prepare<[
        string, string, string, string | null, string | null,
        string | null, string | null, string, number,
        string | null, string | null, string, string
    ]>(`
        INSERT INTO albums (
            id, title, artist, year, category,
            cover_url, cover_override, role_history, listen_count,
            last_listened, story, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
            title = excluded.title,
            artist = excluded.artist,
            year = excluded.year,
            category = excluded.category,
            cover_url = excluded.cover_url,
            cover_override = excluded.cover_override,
            role_history = excluded.role_history,
            listen_count = excluded.listen_count,
            last_listened = excluded.last_listened,
            story = excluded.story,
            updated_at = excluded.updated_at
    `)

    const findAllStmt = db.prepare<[]>(`
        SELECT * FROM albums ORDER BY artist, title
    `)

    const findByIdStmt = db.prepare<[string]>(`
        SELECT * FROM albums WHERE id = ?
    `)

    const findByArtistStmt = db.prepare<[string]>(`
        SELECT * FROM albums WHERE artist = ? ORDER BY title
    `)

    const findByTitleStmt = db.prepare<[string]>(`
        SELECT * FROM albums WHERE title = ? ORDER BY artist
    `)

    const remove = db.prepare<[string]>(`
        DELETE FROM albums WHERE id = ?
    `)

    const existsStmt = db.prepare<[string]>(`
        SELECT 1 FROM albums WHERE id = ?
    `)

    function persist(album: Album): void {
        const record = albumToRecord(album)
        insert.run(
            record.id,
            record.title,
            record.artist,
            record.year,
            record.category,
            record.cover_url,
            record.cover_override,
            record.role_history,
            record.listen_count,
            record.last_listened,
            record.story,
            record.created_at,
            record.updated_at,
        )
    }
    const persistMany = db.transaction((albums: Album[]) => {
        for (const album of albums) persist(album)
    })

    return {
        findAll(): Album[] {
            const records = findAllStmt.all() as AlbumRecord[]
            return records.map(recordToAlbum)
        },

        findById(id: string): Album | undefined {
            const record = findByIdStmt.get(id) as AlbumRecord | undefined
            return record ? recordToAlbum(record) : undefined
        },

        save(album: Album): void {
            persist(album)
        },

        saveMany(albums: Album[]): void {
            persistMany(albums)
        },

        delete(id: string): boolean {
            const info = remove.run(id)
            return info.changes > 0
        },

        exists(id: string): boolean {
            const result = existsStmt.get(id) as { 1: number } | undefined
            return result !== undefined
        },

        findByArtist(artist: string): Album[] {
            const records = findByArtistStmt.all(artist) as AlbumRecord[]
            return records.map(recordToAlbum)
        },

        findByTitle(title: string): Album[] {
            const records = findByTitleStmt.all(title) as AlbumRecord[]
            return records.map(recordToAlbum)
        },
    }
}

export type AlbumRepository = ReturnType<typeof createAlbumRepository>
