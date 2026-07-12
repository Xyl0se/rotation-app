import Database from "better-sqlite3"

export interface ScanRunRecord {
    id: string
    started_at: string
    finished_at: string
    directories_scanned: number
    directories_skipped: number
    album_folders_found: number
    status: "running" | "completed" | "failed"
    error_message: string | null
}

export function createScanRunRepository(db: Database.Database) {
    const insert = db.prepare<[
        string, string, string, number, number, number, string, string | null
    ]>(`
        INSERT INTO scan_runs (id, started_at, finished_at, directories_scanned, directories_skipped, album_folders_found, status, error_message)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)

    const update = db.prepare<[
        string, number, number, number, string, string | null, string
    ]>(`
        UPDATE scan_runs
        SET finished_at = ?, directories_scanned = ?, directories_skipped = ?, album_folders_found = ?, status = ?, error_message = ?
        WHERE id = ?
    `)

    const findLatest = db.prepare<[]>(`
        SELECT * FROM scan_runs ORDER BY started_at DESC LIMIT 1
    `)

    const findById = db.prepare<[string]>(`
        SELECT * FROM scan_runs WHERE id = ?
    `)

    const findAll = db.prepare<[]>(`
        SELECT * FROM scan_runs ORDER BY started_at DESC
    `)

    return {
        create(record: ScanRunRecord): void {
            insert.run(
                record.id,
                record.started_at,
                record.finished_at,
                record.directories_scanned,
                record.directories_skipped,
                record.album_folders_found,
                record.status,
                record.error_message,
            )
        },

        updateResult(
            id: string,
            finishedAt: string,
            directoriesScanned: number,
            directoriesSkipped: number,
            albumFoldersFound: number,
            status: ScanRunRecord["status"],
            errorMessage: string | null,
        ): void {
            update.run(
                finishedAt,
                directoriesScanned,
                directoriesSkipped,
                albumFoldersFound,
                status,
                errorMessage,
                id,
            )
        },

        findLatest(): ScanRunRecord | undefined {
            return findLatest.get() as ScanRunRecord | undefined
        },

        findById(id: string): ScanRunRecord | undefined {
            return findById.get(id) as ScanRunRecord | undefined
        },

        findAll(): ScanRunRecord[] {
            return findAll.all() as ScanRunRecord[]
        },
    }
}

export type ScanRunRepository = ReturnType<typeof createScanRunRepository>
