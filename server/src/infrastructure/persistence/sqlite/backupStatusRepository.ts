import Database from "better-sqlite3"

export interface BackupStatusRecord {
    id: number
    started_at: string
    completed_at: string | null
    success: number
    error_message: string | null
    backup_path: string | null
    size_bytes: number | null
    trigger_type: "cron" | "manual"
}

export function createBackupStatusRepository(db: Database.Database) {
    db.exec(`
        CREATE TABLE IF NOT EXISTS backup_status (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            started_at TEXT NOT NULL,
            completed_at TEXT,
            success INTEGER NOT NULL DEFAULT 0,
            error_message TEXT,
            backup_path TEXT,
            size_bytes INTEGER,
            trigger_type TEXT NOT NULL DEFAULT 'cron'
        );
        CREATE INDEX IF NOT EXISTS idx_backup_status_started_at ON backup_status(started_at DESC);
    `)

    const insert = db.prepare<[
        string, // started_at
        string, // trigger_type
    ]>(`
        INSERT INTO backup_status (started_at, trigger_type)
        VALUES (?, ?)
    `)

    const update = db.prepare<[
        string, // completed_at
        number, // success
        string | null, // error_message
        string | null, // backup_path
        number | null, // size_bytes
        number, // id
    ]>(`
        UPDATE backup_status
        SET completed_at = ?,
            success = ?,
            error_message = ?,
            backup_path = ?,
            size_bytes = ?
        WHERE id = ?
    `)

    const findLatest = db.prepare<[]>(`
        SELECT * FROM backup_status ORDER BY started_at DESC LIMIT 1
    `)

    const findHistory = db.prepare<[
        number, // limit
    ]>(`
        SELECT * FROM backup_status ORDER BY started_at DESC LIMIT ?
    `)

    return {
        startRun(triggerType: "cron" | "manual"): number {
            const now = new Date().toISOString()
            const result = insert.run(now, triggerType)
            return Number(result.lastInsertRowid)
        },

        completeRun(
            id: number,
            success: boolean,
            errorMessage: string | null = null,
            backupPath: string | null = null,
            sizeBytes: number | null = null,
        ): void {
            update.run(
                new Date().toISOString(),
                success ? 1 : 0,
                errorMessage,
                backupPath,
                sizeBytes,
                id,
            )
        },

        getLatest(): BackupStatusRecord | undefined {
            return findLatest.get() as BackupStatusRecord | undefined
        },

        getHistory(limit: number = 20): BackupStatusRecord[] {
            return findHistory.all(limit) as BackupStatusRecord[]
        },
    }
}

export type BackupStatusRepository = ReturnType<typeof createBackupStatusRepository>
