import Database from "better-sqlite3"

export interface ExportLockRecord {
    id: number
    export_id: string | null
    acquired_at: string
    expires_at: string
}

export function createExportLockRepository(db: Database.Database) {
    const acquire = db.prepare<[
        string, // export_id
        string, // acquired_at
        string, // expires_at
    ]>(`
        INSERT INTO export_locks (id, export_id, acquired_at, expires_at)
        VALUES (1, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
            export_id = excluded.export_id,
            acquired_at = excluded.acquired_at,
            expires_at = excluded.expires_at
    `)

    const find = db.prepare<[]>(`
        SELECT * FROM export_locks WHERE id = 1
    `)

    return {
        /**
         * Attempt to acquire the export lock for a given export_id.
         * Returns true if acquired, false if already held by another (non-expired) export.
         */
        acquire(exportId: string, timeoutMinutes: number = 15): boolean {
            const now = new Date()
            const expiresAt = new Date(now.getTime() + timeoutMinutes * 60_000)

            const current = find.get() as ExportLockRecord | undefined

            if (current?.export_id && current.export_id !== exportId) {
                // Another export holds the lock — check if expired
                const expires = new Date(current.expires_at)
                if (expires > now) {
                    return false // Lock held and not expired
                }
                // Expired — we can steal it
            }

            acquire.run(exportId, now.toISOString(), expiresAt.toISOString())
            return true
        },

        /**
         * Releases the lock by deleting the row.
         */
        release(): void {
            db.prepare("DELETE FROM export_locks WHERE id = 1").run()
        },

        /**
         * Get current lock state.
         */
        getCurrent(): ExportLockRecord | undefined {
            return find.get() as ExportLockRecord | undefined
        },

        /**
         * Check if a specific export_id currently holds the lock.
         */
        isHeldBy(exportId: string): boolean {
            const current = find.get() as ExportLockRecord | undefined
            if (!current?.export_id) return false
            if (current.export_id !== exportId) return false
            const expires = new Date(current.expires_at)
            return expires > new Date()
        },
    }
}

export type ExportLockRepository = ReturnType<typeof createExportLockRepository>
