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
 * Führt alle nötigen Datenmigrationen aus,
 * wenn die gespeicherte Schema-Version älter ist
 * als die aktuelle.
 *
 * Schema-Version wird nur nach erfolgreichem Abschluss
 * aller ausstehenden Migrationen aktualisiert.
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
 * Migration von unversionierten Daten (vor v0.11.0-dev).
 *
 * Durchgeführte Migrationen:
 * - isCurrent → Fokusalbum-ID
 * - Legacy listenCount/lastListened bleibt erhalten,
 *   wird später von useListenEvents migriert
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
 * Migration für Schema-Version 2 (v0.17.0-dev).
 *
 * Album Story wurde als optionales Feld eingeführt.
 * Alte Alben ohne Story bleiben gültig.
 * Diese Migration ist formal — die Repository-Normalisierung
 * filtert ungültige Story-Daten bereits beim Laden.
 */
export function migrateToSchemaV2(_adapter: StorageAdapter): void {
    // Keine Datenmigration nötig.
    // Story ist optional; ungültige Daten werden von normalizeAlbum verworfen.
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
