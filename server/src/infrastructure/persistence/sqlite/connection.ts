import Database from "better-sqlite3"
import { join } from "node:path"
import { mkdirSync } from "node:fs"

const DATA_DIR = process.env.ROTATION_DATA_DIR || "./data"
const DB_PATH = join(DATA_DIR, "rotation.db")

export function initDatabase(path?: string): Database.Database {
    const dbPath = path ?? DB_PATH
    if (!path) {
        mkdirSync(DATA_DIR, { recursive: true })
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

        CREATE TABLE IF NOT EXISTS export_locks (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            export_id TEXT,
            acquired_at TEXT NOT NULL,
            expires_at TEXT NOT NULL
        );
    `)
}
