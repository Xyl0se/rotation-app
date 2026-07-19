import Database from "better-sqlite3"

export type PersistedCoverSource = "folder" | "embedded" | "remote" | "upload" | "alternative"
export type CoverResolutionStatus = "cached" | "not-found" | "temporarily-unavailable" | "invalid-image"
export type CoverFailureCode = "local-artwork-not-found" | "remote-not-found" | "remote-temporarily-unavailable" | "invalid-image"

interface CoverResolutionRow {
    album_id: string
    source_type: PersistedCoverSource | null
    status: CoverResolutionStatus
    last_attempt_at: string
    resolved_at: string | null
    failure_code: CoverFailureCode | null
    source_fingerprint: string | null
    size_bytes: number | null
    mime_type: "image/jpeg" | "image/png" | "image/webp" | "image/gif" | null
    width: number | null
    height: number | null
    candidate_urls_json: string
}

export interface CoverResolutionRecord extends Omit<CoverResolutionRow, "candidate_urls_json"> {
    candidate_urls: string[]
}

export interface CoverResolutionSuccess {
    albumId: string
    source: PersistedCoverSource
    attemptedAt: string
    resolvedAt: string
    fingerprint?: string
    sizeBytes: number
    mimeType: "image/jpeg" | "image/png" | "image/webp" | "image/gif"
    width?: number
    height?: number
    candidateUrls?: string[]
}

function mapRow(row: CoverResolutionRow | undefined): CoverResolutionRecord | undefined {
    if (!row) return undefined
    let candidateUrls: string[] = []
    try {
        const parsed = JSON.parse(row.candidate_urls_json) as unknown
        if (Array.isArray(parsed)) candidateUrls = parsed.filter((value): value is string => typeof value === "string")
    } catch {
        // The schema prevents invalid JSON; retain a defensive empty fallback.
    }
    const record: Partial<CoverResolutionRow> = { ...row }
    delete record.candidate_urls_json
    return { ...record, candidate_urls: candidateUrls } as CoverResolutionRecord
}

export function createCoverResolutionRepository(db: Database.Database) {
    const find = db.prepare<[string]>("SELECT * FROM cover_resolution_state WHERE album_id=?")
    const saveSuccess = db.prepare(`
        INSERT INTO cover_resolution_state (
            album_id,source_type,status,last_attempt_at,resolved_at,failure_code,
            source_fingerprint,size_bytes,mime_type,width,height,candidate_urls_json
        ) VALUES (@albumId,@source,'cached',@attemptedAt,@resolvedAt,NULL,@fingerprint,@sizeBytes,@mimeType,@width,@height,@candidateUrls)
        ON CONFLICT(album_id) DO UPDATE SET
            source_type=excluded.source_type,
            status='cached',
            last_attempt_at=excluded.last_attempt_at,
            resolved_at=excluded.resolved_at,
            failure_code=NULL,
            source_fingerprint=excluded.source_fingerprint,
            size_bytes=excluded.size_bytes,
            mime_type=excluded.mime_type,
            width=excluded.width,
            height=excluded.height,
            candidate_urls_json=excluded.candidate_urls_json
    `)
    const saveFailure = db.prepare(`
        INSERT INTO cover_resolution_state (
            album_id,source_type,status,last_attempt_at,resolved_at,failure_code,candidate_urls_json
        ) VALUES (@albumId,NULL,@status,@attemptedAt,NULL,@failureCode,@candidateUrls)
        ON CONFLICT(album_id) DO UPDATE SET
            status=CASE
                WHEN cover_resolution_state.resolved_at IS NOT NULL THEN 'cached'
                ELSE excluded.status
            END,
            last_attempt_at=excluded.last_attempt_at,
            failure_code=excluded.failure_code,
            candidate_urls_json=excluded.candidate_urls_json
    `)
    const remove = db.prepare<[string]>("DELETE FROM cover_resolution_state WHERE album_id=?")

    return {
        findByAlbumId(albumId: string): CoverResolutionRecord | undefined {
            return mapRow(find.get(albumId) as CoverResolutionRow | undefined)
        },

        recordSuccess(input: CoverResolutionSuccess): void {
            saveSuccess.run({
                ...input,
                fingerprint: input.fingerprint ?? null,
                candidateUrls: JSON.stringify(input.candidateUrls ?? []),
            })
        },

        recordFailure(albumId: string, status: CoverResolutionStatus, attemptedAt: string,
            failureCode: CoverFailureCode, candidateUrls: string[] = []): void {
            saveFailure.run({ albumId, status, attemptedAt, failureCode, candidateUrls: JSON.stringify(candidateUrls) })
        },

        delete(albumId: string): void {
            remove.run(albumId)
        },
    }
}

export type CoverResolutionRepository = ReturnType<typeof createCoverResolutionRepository>
