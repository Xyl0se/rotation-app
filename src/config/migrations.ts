import type { StorageAdapter } from "../adapters/storageAdapter"
import { STORAGE } from "./storage"
import {
    registerMigration,
    runRegisteredMigrations,
} from "./migrationRegistry"
import {
    SCHEMA_VERSION,
    getStoredSchemaVersion,
    setStoredSchemaVersion,
} from "./schemaVersion"

/**
 * Runs all necessary data migrations
 * when the stored schema version is older
 * than the current one.
 *
 * Schema version is only updated after successful completion
 * of all pending migrations.
 */
export function runMigrations(adapter: StorageAdapter): void {
    const storedVersion = getStoredSchemaVersion(adapter)

    if (storedVersion === SCHEMA_VERSION) {
        return
    }

    const from = storedVersion ?? "0"
    runRegisteredMigrations(adapter, from)
    setStoredSchemaVersion(adapter, SCHEMA_VERSION)
}

/**
 * Migration from unversioned data (before v0.11.0-dev).
 *
 * Performed migrations:
 * - isCurrent → focus album ID
 * - Legacy listenCount/lastListened is preserved,
 *   will be migrated later by useListenEvents
 */
export function migrateFromUnversioned(adapter: StorageAdapter): void {
    const raw = adapter.get(STORAGE.LIBRARY)
    if (!raw) {
        return
    }
    try {
        const albums = JSON.parse(raw) as Array<{
            id: string
            isCurrent?: boolean
        }>
        const focusAlbum = albums.find(album => album.isCurrent === true)
        if (focusAlbum) {
            adapter.set(STORAGE.FOCUS_ALBUM, focusAlbum.id)
        }
    } catch {
        // ignore
    }
}

/**
 * Migration for schema version 2 (v0.17.0-dev).
 *
 * Album Story was introduced as an optional field.
 * Old albums without Story remain valid.
 * This migration is formal — the repository normalization
 * already filters invalid Story data on load.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function migrateToSchemaV2(_adapter: StorageAdapter): void {
    // No data migration needed.
    // Story is optional; invalid data is discarded by normalizeAlbum.
}

// Register all migrations in this module.
// Importing this module prepares the migration registry.
registerMigration({
    version: "1",
    name: "isCurrent to focusAlbum",
    run: migrateFromUnversioned,
})

registerMigration({
    version: "2",
    name: "add optional album story",
    run: migrateToSchemaV2,
})
