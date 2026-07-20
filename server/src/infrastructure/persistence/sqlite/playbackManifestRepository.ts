import Database from "better-sqlite3"
import type { OrderingDiagnostic, PlaybackManifest, PlaybackManifestCacheEntry } from "../../../domain/playback/playbackManifest.js"

interface DbRow {
    album_id: string
    manifest_json: string
    ordering_diagnostic: OrderingDiagnostic
    filename_fallback_used: number
    cached_at: string
    invalidated_at: string | null
}

export function createPlaybackManifestRepository(db: Database.Database) {
    const insert = db.prepare<[string, string, string, number, string]>(`
        INSERT INTO playback_manifest_cache
            (album_id, manifest_json, ordering_diagnostic, filename_fallback_used, cached_at)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(album_id) DO UPDATE SET
            manifest_json = excluded.manifest_json,
            ordering_diagnostic = excluded.ordering_diagnostic,
            filename_fallback_used = excluded.filename_fallback_used,
            cached_at = excluded.cached_at,
            invalidated_at = NULL
    `)

    const findById = db.prepare<[string]>(`
        SELECT * FROM playback_manifest_cache
        WHERE album_id = ? AND invalidated_at IS NULL
    `)

    const invalidateById = db.prepare<[string, string]>(`
        UPDATE playback_manifest_cache
        SET invalidated_at = ?
        WHERE album_id = ?
    `)

    const invalidateAll = db.prepare<[string]>(`
        UPDATE playback_manifest_cache
        SET invalidated_at = ?
        WHERE invalidated_at IS NULL
    `)

    const deleteById = db.prepare<[string]>(`
        DELETE FROM playback_manifest_cache WHERE album_id = ?
    `)

    function rowToCacheEntry(row: DbRow): PlaybackManifestCacheEntry {
        return {
            albumId: row.album_id,
            manifest: JSON.parse(row.manifest_json) as PlaybackManifest,
            orderingDiagnostic: row.ordering_diagnostic,
            filenameFallbackUsed: row.filename_fallback_used === 1,
            cachedAt: row.cached_at,
            invalidatedAt: row.invalidated_at,
        }
    }

    return {
        save(
            albumId: string,
            manifest: PlaybackManifest,
            orderingDiagnostic: OrderingDiagnostic,
            filenameFallbackUsed: boolean,
            cachedAt: string,
        ): void {
            insert.run(
                albumId,
                JSON.stringify(manifest),
                orderingDiagnostic,
                filenameFallbackUsed ? 1 : 0,
                cachedAt,
            )
        },

        getManifest(albumId: string): PlaybackManifestCacheEntry | null {
            const row = findById.get(albumId) as DbRow | undefined
            if (!row) return null
            return rowToCacheEntry(row)
        },

        invalidateManifest(albumId: string): boolean {
            const info = invalidateById.run(new Date().toISOString(), albumId)
            return info.changes > 0
        },

        invalidateAll(): number {
            const info = invalidateAll.run(new Date().toISOString())
            return info.changes
        },

        deleteManifest(albumId: string): boolean {
            const info = deleteById.run(albumId)
            return info.changes > 0
        },
    }
}

export type PlaybackManifestRepository = ReturnType<typeof createPlaybackManifestRepository>