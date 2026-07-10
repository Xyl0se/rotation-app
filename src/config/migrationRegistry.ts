import type { StorageAdapter } from "../adapters/storageAdapter"

export type Migration = {
    version: string
    name: string
    run: (adapter: StorageAdapter) => void
}

const migrations: Migration[] = []

function isValidVersion(version: string): boolean {
    return /^[1-9]\d*$/.test(version)
}

function compareVersions(a: string, b: string): number {
    return a.localeCompare(b, undefined, { numeric: true })
}

/**
 * Registriert eine Migration.
 *
 * Idempotent bei identischem Version + Name.
 * Wirft einen Fehler bei gleicher Version aber anderem Namen (echter Konflikt).
 */
export function registerMigration(migration: Migration): void {
    if (!isValidVersion(migration.version)) {
        throw new Error(
            `Invalid migration version "${migration.version}". ` +
                "Must be a positive integer string (e.g. \"1\", \"2\", \"10\").",
        )
    }

    const existing = migrations.find(m => m.version === migration.version)

    if (existing) {
        if (existing.name === migration.name) {
            // Idempotent: identische Migration bereits registriert
            return
        }
        throw new Error(
            `Migration version "${migration.version}" already registered with name "${existing.name}". ` +
                `Cannot register "${migration.name}".`,
        )
    }

    migrations.push(migration)
    migrations.sort((a, b) => compareVersions(a.version, b.version))
}

/**
 * Gibt alle registrierten Migrationen zurück (sortiert nach Version).
 */
export function getMigrations(): readonly Migration[] {
    return [...migrations]
}

/**
 * Leert die Registry. NUR für Tests verwenden.
 */
export function clearMigrations(): void {
    migrations.length = 0
}

/**
 * Führt alle Migrationen aus, deren Version größer ist als `fromVersion`.
 *
 * Wirft bei Fehler — die Schema-Version wird NICHT aktualisiert.
 */
export function runRegisteredMigrations(
    adapter: StorageAdapter,
    fromVersion: string,
): void {
    const pending = migrations.filter(
        m => compareVersions(m.version, fromVersion) > 0,
    )

    for (const migration of pending) {
        migration.run(adapter)
    }
}
