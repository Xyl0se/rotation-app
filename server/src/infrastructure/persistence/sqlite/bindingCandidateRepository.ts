import Database from "better-sqlite3"
import type { RankedBindingCandidate } from "../../../domain/binding/albumMatcher.js"

export interface BindingCandidateRecord extends RankedBindingCandidate {
    bindingAlbumId: string
    scanId: string
    rank: number
    createdAt: string
}

export function createBindingCandidateRepository(db: Database.Database) {
    const replaceForBinding = db.transaction((bindingAlbumId: string, scanId: string, candidates: RankedBindingCandidate[]) => {
        db.prepare("DELETE FROM binding_candidates WHERE binding_album_id = ?").run(bindingAlbumId)
        const insert = db.prepare(`
            INSERT INTO binding_candidates (
                binding_album_id, library_album_id, scan_id, rank, score,
                confidence, reasons_json, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `)
        const createdAt = new Date().toISOString()
        candidates.forEach((candidate, index) => insert.run(
            bindingAlbumId, candidate.libraryAlbumId, scanId, index + 1,
            candidate.score, candidate.confidence, JSON.stringify(candidate.reasons), createdAt,
        ))
    })
    const selectCandidate = db.transaction((bindingAlbumId: string, libraryAlbumId: string, scanId: string, confirmedAt: string) => {
        const candidate = db.prepare(`
            SELECT scan_id FROM binding_candidates
            WHERE binding_album_id = ? AND library_album_id = ?
        `).get(bindingAlbumId, libraryAlbumId) as { scan_id: string } | undefined
        if (!candidate) return "NOT_FOUND" as const
        if (candidate.scan_id !== scanId) return "STALE_SCAN" as const
        const existing = db.prepare(`
            SELECT album_id FROM bindings
            WHERE library_album_id = ? AND album_id != ?
        `).get(libraryAlbumId, bindingAlbumId) as { album_id: string } | undefined
        if (existing) return "ALBUM_ALREADY_BOUND" as const
        db.prepare(`
            UPDATE bindings SET library_album_id = ?, state = 'confirmed',
                match_source = 'manual', confirmed_at = ? WHERE album_id = ?
        `).run(libraryAlbumId, confirmedAt, bindingAlbumId)
        db.prepare("DELETE FROM binding_candidates WHERE binding_album_id = ?").run(bindingAlbumId)
        return "SELECTED" as const
    })
    const selectLibraryAlbum = db.transaction((bindingAlbumId: string, libraryAlbumId: string, confirmedAt: string) => {
        const existing = db.prepare(`SELECT album_id FROM bindings WHERE library_album_id = ? AND album_id != ?`)
            .get(libraryAlbumId, bindingAlbumId) as { album_id: string } | undefined
        if (existing) return "ALBUM_ALREADY_BOUND" as const
        const result = db.prepare(`
            UPDATE bindings SET library_album_id = ?, state = 'confirmed',
                match_source = 'manual', confirmed_at = ? WHERE album_id = ?
        `).run(libraryAlbumId, confirmedAt, bindingAlbumId)
        if (result.changes === 0) return "NOT_FOUND" as const
        db.prepare("DELETE FROM binding_candidates WHERE binding_album_id = ?").run(bindingAlbumId)
        return "SELECTED" as const
    })

    return {
        replaceForBinding(bindingAlbumId: string, scanId: string, candidates: RankedBindingCandidate[]): void {
            replaceForBinding(bindingAlbumId, scanId, candidates)
        },
        findByBinding(bindingAlbumId: string): BindingCandidateRecord[] {
            const rows = db.prepare(`
                SELECT c.*, a.title, a.artist
                FROM binding_candidates c
                JOIN albums a ON a.id = c.library_album_id
                WHERE c.binding_album_id = ?
                ORDER BY c.rank
            `).all(bindingAlbumId) as Array<Record<string, unknown>>
            return rows.map(row => ({
                bindingAlbumId: row.binding_album_id as string,
                libraryAlbumId: row.library_album_id as string,
                scanId: row.scan_id as string,
                rank: row.rank as number,
                score: row.score as number,
                confidence: row.confidence as BindingCandidateRecord["confidence"],
                reasons: JSON.parse(row.reasons_json as string) as BindingCandidateRecord["reasons"],
                createdAt: row.created_at as string,
                title: row.title as string,
                artist: row.artist as string,
            }))
        },
        deleteForBinding(bindingAlbumId: string): void {
            db.prepare("DELETE FROM binding_candidates WHERE binding_album_id = ?").run(bindingAlbumId)
        },
        selectCandidate(bindingAlbumId: string, libraryAlbumId: string, scanId: string, confirmedAt: string) {
            return selectCandidate(bindingAlbumId, libraryAlbumId, scanId, confirmedAt)
        },
        selectLibraryAlbum(bindingAlbumId: string, libraryAlbumId: string, confirmedAt: string) {
            return selectLibraryAlbum(bindingAlbumId, libraryAlbumId, confirmedAt)
        },
    }
}

export type BindingCandidateRepository = ReturnType<typeof createBindingCandidateRepository>
