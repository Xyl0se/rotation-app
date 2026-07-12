import Database from "better-sqlite3"

export interface ExportOperationRecord {
    id: string
    rotation_plan_id: string | null
    created_at: string
    status: "created" | "previewed" | "staged" | "applied" | "archived" | "rolled_back"
    album_ids: string
    staging_path: string | null
    archive_path: string | null
    total_size_bytes: number | null
    file_count: number | null
}

export function createExportOperationRepository(db: Database.Database) {
    const insert = db.prepare<[
        string, string | null, string, string, string, string | null, string | null, number | null, number | null
    ]>(`
        INSERT INTO export_operations (
            id, rotation_plan_id, created_at, status, album_ids,
            staging_path, archive_path, total_size_bytes, file_count
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
            rotation_plan_id = excluded.rotation_plan_id,
            created_at = excluded.created_at,
            status = excluded.status,
            album_ids = excluded.album_ids,
            staging_path = excluded.staging_path,
            archive_path = excluded.archive_path,
            total_size_bytes = excluded.total_size_bytes,
            file_count = excluded.file_count
    `)

    const findById = db.prepare<[string]>(`
        SELECT * FROM export_operations WHERE id = ?
    `)

    const findAll = db.prepare<[]>(`
        SELECT * FROM export_operations ORDER BY created_at DESC
    `)

    const findLatest = db.prepare<[]>(`
        SELECT * FROM export_operations ORDER BY created_at DESC LIMIT 1
    `)

    const updateStatus = db.prepare<[string, string]>(`
        UPDATE export_operations SET status = ? WHERE id = ?
    `)

    return {
        save(record: ExportOperationRecord): void {
            insert.run(
                record.id,
                record.rotation_plan_id,
                record.created_at,
                record.status,
                record.album_ids,
                record.staging_path,
                record.archive_path,
                record.total_size_bytes,
                record.file_count,
            )
        },

        findById(id: string): ExportOperationRecord | undefined {
            return findById.get(id) as ExportOperationRecord | undefined
        },

        findAll(): ExportOperationRecord[] {
            return findAll.all() as ExportOperationRecord[]
        },

        findLatest(): ExportOperationRecord | undefined {
            return findLatest.get() as ExportOperationRecord | undefined
        },

        setStatus(id: string, status: ExportOperationRecord["status"]): void {
            updateStatus.run(status, id)
        },
    }
}

export type ExportOperationRepository = ReturnType<typeof createExportOperationRepository>
