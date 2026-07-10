import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { createMemoryStorageAdapter } from "../adapters/memoryStorageAdapter"
import { runMigrations, migrateFromUnversioned } from "./migrations"
import { clearMigrations, registerMigration } from "./migrationRegistry"
import { SCHEMA_VERSION, STORAGE_VERSION } from "./schemaVersion"
import { STORAGE } from "./storage"

describe("runMigrations", () => {
    let adapter = createMemoryStorageAdapter()

    beforeEach(() => {
        adapter = createMemoryStorageAdapter()
        clearMigrations()
    })

    afterEach(() => {
        clearMigrations()
    })

    it("sets schema version on first run", () => {
        registerMigration({
            version: "1",
            name: "isCurrent to focusAlbum",
            run: migrateFromUnversioned,
        })
        runMigrations(adapter)
        expect(adapter.get(STORAGE_VERSION)).toBe(SCHEMA_VERSION)
    })

    it("does nothing when version already matches", () => {
        adapter.set(STORAGE_VERSION, SCHEMA_VERSION)
        runMigrations(adapter)
        expect(adapter.get(STORAGE_VERSION)).toBe(SCHEMA_VERSION)
    })

    it("migrates isCurrent to focusAlbum", () => {
        registerMigration({
            version: "1",
            name: "isCurrent to focusAlbum",
            run: migrateFromUnversioned,
        })
        const albums = [
            { id: "album-a", title: "A", isCurrent: false },
            { id: "album-b", title: "B", isCurrent: true },
        ]
        adapter.set(STORAGE.LIBRARY, JSON.stringify(albums))
        runMigrations(adapter)
        expect(adapter.get(STORAGE.FOCUS_ALBUM)).toBe("album-b")
    })

    it("does not set focusAlbum when no album has isCurrent", () => {
        registerMigration({
            version: "1",
            name: "isCurrent to focusAlbum",
            run: migrateFromUnversioned,
        })
        const albums = [
            { id: "album-a", title: "A", isCurrent: false },
        ]
        adapter.set(STORAGE.LIBRARY, JSON.stringify(albums))
        runMigrations(adapter)
        expect(adapter.get(STORAGE.FOCUS_ALBUM)).toBeNull()
    })

    it("handles missing library gracefully", () => {
        registerMigration({
            version: "1",
            name: "isCurrent to focusAlbum",
            run: migrateFromUnversioned,
        })
        expect(() => runMigrations(adapter)).not.toThrow()
        expect(adapter.get(STORAGE_VERSION)).toBe(SCHEMA_VERSION)
    })

    it("handles invalid library JSON gracefully", () => {
        registerMigration({
            version: "1",
            name: "isCurrent to focusAlbum",
            run: migrateFromUnversioned,
        })
        adapter.set(STORAGE.LIBRARY, "not-json")
        expect(() => runMigrations(adapter)).not.toThrow()
        expect(adapter.get(STORAGE_VERSION)).toBe(SCHEMA_VERSION)
    })

    it("does not update schema version when a migration fails", () => {
        registerMigration({
            version: "1",
            name: "failing migration",
            run: () => {
                throw new Error("migration failed")
            },
        })

        // storedVersion is null, so migration "1" should run
        expect(() => runMigrations(adapter)).toThrow("migration failed")
        // Schema version should remain unset — not bumped to SCHEMA_VERSION
        expect(adapter.get(STORAGE_VERSION)).toBeNull()
    })
})
