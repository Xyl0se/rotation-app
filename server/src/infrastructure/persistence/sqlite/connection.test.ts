import { afterEach, describe, expect, it } from "vitest"
import Database from "better-sqlite3"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { initDatabase } from "./connection.js"

const temporaryDirectories: string[] = []

afterEach(() => {
    for (const directory of temporaryDirectories.splice(0)) {
        rmSync(directory, { recursive: true, force: true })
    }
})

function legacyDatabase() {
    const directory = mkdtempSync(join(tmpdir(), "rotation-migration-"))
    temporaryDirectories.push(directory)
    const path = join(directory, "rotation.db")
    const db = new Database(path)
    db.exec(`
        CREATE TABLE albums (
            id TEXT PRIMARY KEY, title TEXT NOT NULL, artist TEXT NOT NULL, year TEXT,
            category TEXT, cover_url TEXT, cover_override TEXT, role_history TEXT NOT NULL DEFAULT '[]',
            listen_count INTEGER NOT NULL DEFAULT 0, last_listened TEXT, story TEXT,
            created_at TEXT NOT NULL, updated_at TEXT NOT NULL
        );
        CREATE TABLE bindings (
            album_id TEXT PRIMARY KEY, relative_path TEXT NOT NULL, state TEXT NOT NULL,
            match_source TEXT, proposed_at TEXT, confirmed_at TEXT, library_album_id TEXT
        );
    `)
    return { db, path }
}

describe("SQLite schema migrations", () => {
    it("records every migration and sets the user version", () => {
        const db = initDatabase(":memory:")

        expect(db.pragma("user_version", { simple: true })).toBe(9)
        expect(db.prepare("SELECT version, name FROM schema_migrations ORDER BY version").all())
            .toEqual([
                { version: 1, name: "initial-schema" },
                { version: 2, name: "album-integrity-and-binding-foreign-key" },
                { version: 3, name: "binding-candidate-review" },
                { version: 4, name: "canonical-rotation-and-listening-state" },
                { version: 5, name: "rotation-role-eligibility" },
                { version: 6, name: "restore-classic-rotation-eligibility" },
                { version: 7, name: "server-owned-rotation-settings" },
                { version: 8, name: "rotation-lifecycle-history" },
                { version: 9, name: "domain-audit-trail" },
            ])
        db.close()
    })

    it("defensively normalizes invalid legacy album data", () => {
        const { db: legacy, path } = legacyDatabase()
        legacy.prepare(`
            INSERT INTO albums VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run("album-1", "", "", "a very long but allowed year", "obsolete-role", null, "not-json", "bad-json", -5, null, "bad-json", "created", "updated")
        legacy.close()

        const db = initDatabase(path)
        const album = db.prepare("SELECT * FROM albums WHERE id = ?").get("album-1") as Record<string, unknown>

        expect(album.title).toBe("Untitled")
        expect(album.artist).toBe("Unknown Artist")
        expect(album.category).toBeNull()
        expect(album.cover_override).toBeNull()
        expect(album.role_history).toBe("[]")
        expect(album.listen_count).toBe(0)
        expect(album.story).toBeNull()
        db.close()
    })

    it("nulls orphan links and applies ON DELETE SET NULL to valid links", () => {
        const { db: legacy, path } = legacyDatabase()
        const insertAlbum = legacy.prepare("INSERT INTO albums VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
        insertAlbum.run("album-1", "Album", "Artist", "2024", "new", null, null, "[]", 0, null, null, "created", "updated")
        const insertBinding = legacy.prepare("INSERT INTO bindings VALUES (?, ?, ?, ?, ?, ?, ?)")
        insertBinding.run("folder-1", "Artist/Album", "confirmed", "manual", null, "now", "album-1")
        insertBinding.run("folder-2", "Missing/Album", "confirmed", "manual", null, "now", "missing-id")
        legacy.close()

        const db = initDatabase(path)
        expect((db.prepare("SELECT library_album_id FROM bindings WHERE album_id = 'folder-2'").get() as { library_album_id: string | null }).library_album_id).toBeNull()

        db.prepare("DELETE FROM albums WHERE id = 'album-1'").run()
        expect((db.prepare("SELECT library_album_id FROM bindings WHERE album_id = 'folder-1'").get() as { library_album_id: string | null }).library_album_id).toBeNull()
        db.close()
    })

    it("is idempotent when opening an already migrated database", () => {
        const { path } = legacyDatabase()
        const first = initDatabase(path)
        first.close()
        const second = initDatabase(path)

        expect(second.prepare("SELECT COUNT(*) AS count FROM schema_migrations").get())
            .toEqual({ count: 9 })
        second.close()
    })
})
