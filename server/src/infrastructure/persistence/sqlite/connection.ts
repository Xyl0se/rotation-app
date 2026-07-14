import Database from "better-sqlite3"
import { join } from "node:path"
import { mkdirSync, accessSync, constants } from "node:fs"

const DATA_DIR = process.env.ROTATION_DATA_DIR || "./data"
const DB_PATH = join(DATA_DIR, "rotation.db")

export function initDatabase(path?: string): Database.Database {
    const dbPath = path ?? DB_PATH
    if (!path) {
        mkdirSync(DATA_DIR, { recursive: true })
        try {
            accessSync(DATA_DIR, constants.W_OK)
        } catch {
            throw new Error(
                `Rotation data directory is not writable: ${DATA_DIR}\n` +
                `Ensure the container user has write permissions on this path.`
            )
        }
    }
    const db = new Database(dbPath)
    db.pragma("journal_mode = WAL")
    db.pragma("foreign_keys = ON")
    migrate(db)
    return db
}

function migrate(db: Database.Database): void {
    db.exec(`
        CREATE TABLE IF NOT EXISTS bindings (
            album_id TEXT PRIMARY KEY,
            relative_path TEXT NOT NULL,
            state TEXT CHECK(state IN ('unbound', 'proposed', 'confirmed', 'missing')) NOT NULL DEFAULT 'unbound',
            match_source TEXT CHECK(match_source IN ('scan-exact', 'manual')),
            proposed_at TEXT,
            confirmed_at TEXT
        );

        CREATE TABLE IF NOT EXISTS albums (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            artist TEXT NOT NULL,
            year TEXT,
            category TEXT,
            cover_url TEXT,
            cover_override TEXT,
            role_history TEXT NOT NULL DEFAULT '[]',
            listen_count INTEGER NOT NULL DEFAULT 0,
            last_listened TEXT,
            story TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS export_operations (
            id TEXT PRIMARY KEY,
            rotation_plan_id TEXT,
            created_at TEXT NOT NULL,
            status TEXT CHECK(status IN ('created', 'previewed', 'staged', 'applied', 'archived', 'rolled_back')) NOT NULL DEFAULT 'created',
            album_ids TEXT NOT NULL,
            staging_path TEXT,
            archive_path TEXT,
            total_size_bytes INTEGER,
            file_count INTEGER
        );

        CREATE TABLE IF NOT EXISTS scan_runs (
            id TEXT PRIMARY KEY,
            started_at TEXT NOT NULL,
            finished_at TEXT NOT NULL,
            directories_scanned INTEGER NOT NULL DEFAULT 0,
            directories_skipped INTEGER NOT NULL DEFAULT 0,
            album_folders_found INTEGER NOT NULL DEFAULT 0,
            status TEXT CHECK(status IN ('running', 'completed', 'failed')) NOT NULL DEFAULT 'running',
            error_message TEXT
        );

        CREATE INDEX IF NOT EXISTS idx_bindings_album_id ON bindings(album_id);

        CREATE TABLE IF NOT EXISTS export_locks (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            export_id TEXT,
            acquired_at TEXT NOT NULL,
            expires_at TEXT NOT NULL
        );
    `)
}
