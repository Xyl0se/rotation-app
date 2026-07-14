import Database from "better-sqlite3"

export type BindingState = "unbound" | "proposed" | "confirmed" | "missing"
export type MatchSource = "scan-exact" | "manual" | null

export interface BindingRecord {
    album_id: string
    relative_path: string
    state: BindingState
    match_source: MatchSource
    proposed_at: string | null
    confirmed_at: string | null
    library_album_id: string | null
}

export interface BindingWithAlbumRecord extends BindingRecord {
    title: string | null
    artist: string | null
}

export function createBindingRepository(db: Database.Database) {
    const insert = db.prepare<[
        string, string, string, string | null, string | null, string | null, string | null
    ]>(`
        INSERT INTO bindings (album_id, relative_path, state, match_source, proposed_at, confirmed_at, library_album_id)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(album_id) DO UPDATE SET
            relative_path = excluded.relative_path,
            state = CASE
                WHEN bindings.state = 'confirmed' THEN bindings.state
                ELSE excluded.state
            END,
            match_source = CASE
                WHEN bindings.state = 'confirmed' THEN bindings.match_source
                ELSE excluded.match_source
            END,
            proposed_at = CASE
                WHEN bindings.state = 'confirmed' THEN bindings.proposed_at
                ELSE excluded.proposed_at
            END,
            confirmed_at = CASE
                WHEN bindings.state = 'confirmed' THEN bindings.confirmed_at
                ELSE excluded.confirmed_at
            END,
            library_album_id = CASE
                WHEN excluded.library_album_id IS NOT NULL THEN excluded.library_album_id
                ELSE bindings.library_album_id
            END
    `)

    const findById = db.prepare<[string]>(`
        SELECT * FROM bindings WHERE album_id = ?
    `)

    const findAll = db.prepare<[]>(`
        SELECT * FROM bindings ORDER BY album_id
    `)

    const findByState = db.prepare<[string]>(`
        SELECT * FROM bindings WHERE state = ? ORDER BY album_id
    `)

    const findByPath = db.prepare<[string]>(`
        SELECT * FROM bindings WHERE relative_path = ?
    `)

    const findByLibraryAlbumId = db.prepare<[string]>(`
        SELECT * FROM bindings WHERE library_album_id = ?
    `)

    const confirm = db.prepare<[string, string, string]>(`
        UPDATE bindings
        SET state = 'confirmed', match_source = ?, confirmed_at = ?
        WHERE album_id = ?
    `)

    const updateState = db.prepare<[string, string]>(`
        UPDATE bindings
        SET state = ?
        WHERE album_id = ?
    `)

    const updateLibraryAlbumId = db.prepare<[string | null, string]>(`
        UPDATE bindings
        SET library_album_id = ?
        WHERE album_id = ?
    `)

    const upsertProposed = db.prepare<[
        string, string, string, string | null, string | null, string | null, string | null
    ]>(`
        INSERT INTO bindings (album_id, relative_path, state, match_source, proposed_at, confirmed_at, library_album_id)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(album_id) DO UPDATE SET
            relative_path = excluded.relative_path,
            state = CASE
                WHEN bindings.state = 'confirmed' THEN bindings.state
                ELSE excluded.state
            END,
            match_source = CASE
                WHEN bindings.state = 'confirmed' THEN bindings.match_source
                ELSE excluded.match_source
            END,
            proposed_at = CASE
                WHEN bindings.state = 'confirmed' THEN bindings.proposed_at
                WHEN bindings.relative_path != excluded.relative_path THEN excluded.proposed_at
                WHEN bindings.proposed_at IS NULL THEN excluded.proposed_at
                ELSE bindings.proposed_at
            END,
            confirmed_at = CASE
                WHEN bindings.state = 'confirmed' THEN bindings.confirmed_at
                ELSE excluded.confirmed_at
            END,
            library_album_id = CASE
                WHEN excluded.library_album_id IS NOT NULL THEN excluded.library_album_id
                ELSE bindings.library_album_id
            END
    `)

    const remove = db.prepare<[string]>(`
        DELETE FROM bindings WHERE album_id = ?
    `)

    const findOrphans = db.prepare<[]>(`
        SELECT
            b.album_id,
            b.relative_path,
            b.state,
            b.match_source,
            b.proposed_at,
            b.confirmed_at,
            b.library_album_id,
            a.title,
            a.artist
        FROM bindings b
        LEFT JOIN albums a ON b.library_album_id = a.id
        WHERE a.id IS NULL
        ORDER BY b.album_id
    `)

    const findWithAlbumData = db.prepare<[]>(`
        SELECT
            b.album_id,
            b.relative_path,
            b.state,
            b.match_source,
            b.proposed_at,
            b.confirmed_at,
            b.library_album_id,
            a.title,
            a.artist
        FROM bindings b
        LEFT JOIN albums a ON b.library_album_id = a.id
        ORDER BY b.album_id
    `)

    const findWithAlbumDataById = db.prepare<[string]>(`
        SELECT
            b.album_id,
            b.relative_path,
            b.state,
            b.match_source,
            b.proposed_at,
            b.confirmed_at,
            b.library_album_id,
            a.title,
            a.artist
        FROM bindings b
        LEFT JOIN albums a ON b.library_album_id = a.id
        WHERE b.album_id = ?
    `)

    const findWithAlbumDataByState = db.prepare<[string]>(`
        SELECT
            b.album_id,
            b.relative_path,
            b.state,
            b.match_source,
            b.proposed_at,
            b.confirmed_at,
            b.library_album_id,
            a.title,
            a.artist
        FROM bindings b
        LEFT JOIN albums a ON b.library_album_id = a.id
        WHERE b.state = ?
        ORDER BY b.album_id
    `)

    return {
        save(record: BindingRecord): void {
            insert.run(
                record.album_id,
                record.relative_path,
                record.state,
                record.match_source,
                record.proposed_at,
                record.confirmed_at,
                record.library_album_id,
            )
        },

        findById(albumId: string): BindingRecord | undefined {
            return findById.get(albumId) as BindingRecord | undefined
        },

        findAll(): BindingRecord[] {
            return findAll.all() as BindingRecord[]
        },

        findByState(state: BindingState): BindingRecord[] {
            return findByState.all(state) as BindingRecord[]
        },

        findByPath(relativePath: string): BindingRecord | undefined {
            return findByPath.get(relativePath) as BindingRecord | undefined
        },

        findByLibraryAlbumId(libraryAlbumId: string): BindingRecord | undefined {
            return findByLibraryAlbumId.get(libraryAlbumId) as BindingRecord | undefined
        },

        confirm(albumId: string, matchSource: MatchSource, confirmedAt: string): boolean {
            const info = confirm.run(matchSource as string, confirmedAt, albumId)
            return info.changes > 0
        },

        updateState(albumId: string, state: BindingState): boolean {
            const info = updateState.run(state, albumId)
            return info.changes > 0
        },

        updateLibraryAlbumId(albumId: string, libraryAlbumId: string | null): boolean {
            const info = updateLibraryAlbumId.run(libraryAlbumId, albumId)
            return info.changes > 0
        },

        delete(albumId: string): boolean {
            const info = remove.run(albumId)
            return info.changes > 0
        },

        upsertProposed(albumId: string, relativePath: string, proposedAt: string, libraryAlbumId?: string): boolean {
            const info = upsertProposed.run(
                albumId,
                relativePath,
                "proposed",
                "scan-exact",
                proposedAt,
                null,
                libraryAlbumId ?? null,
            )
            return info.changes > 0
        },

        findOrphans(): BindingWithAlbumRecord[] {
            return findOrphans.all() as BindingWithAlbumRecord[]
        },

        findWithAlbumData(): BindingWithAlbumRecord[] {
            return findWithAlbumData.all() as BindingWithAlbumRecord[]
        },

        findWithAlbumDataById(albumId: string): BindingWithAlbumRecord | undefined {
            return findWithAlbumDataById.get(albumId) as BindingWithAlbumRecord | undefined
        },

        findWithAlbumDataByState(state: BindingState): BindingWithAlbumRecord[] {
            return findWithAlbumDataByState.all(state) as BindingWithAlbumRecord[]
        },
    }
}

export type BindingRepository = ReturnType<typeof createBindingRepository>
