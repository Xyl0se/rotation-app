import type { StorageAdapter } from "../../adapters/storageAdapter"

import { SCHEMA_VERSION } from "../../config/schemaVersion"

const BACKUP_KEYS = [
    "rotation-library",
    "rotation-onboarding-complete",
    "rotation-current-plan",
    "rotation-active-plan",
    "rotation-listen-events",
    "rotation-schema-version",
    "rotation-focus-album-id",
]

export interface BackupData {
    schemaVersion: string
    exportedAt: string
    data: Record<string, string | null>
}

export class BackupValidationError extends Error {
    constructor(message: string) {
        super(message)
        this.name = "BackupValidationError"
    }
}

export function createBackup(adapter: StorageAdapter): BackupData {
    const data: Record<string, string | null> = {}

    for (const key of BACKUP_KEYS) {
        data[key] = adapter.get(key)
    }

    return {
        schemaVersion: SCHEMA_VERSION,
        exportedAt: new Date().toISOString(),
        data,
    }
}

export function downloadBackup(backup: BackupData): void {
    const blob = new Blob([JSON.stringify(backup, null, 2)], {
        type: "application/json",
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `rotation-backup-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
}

export function validateBackup(value: unknown): BackupData {
    if (typeof value !== "object" || value === null) {
        throw new BackupValidationError("Ungültiges Backup-Format.")
    }

    const obj = value as Record<string, unknown>

    if (typeof obj.schemaVersion !== "string") {
        throw new BackupValidationError("Backup hat keine gültige Schema-Version.")
    }

    if (typeof obj.exportedAt !== "string") {
        throw new BackupValidationError("Backup hat kein gültiges Export-Datum.")
    }

    if (typeof obj.data !== "object" || obj.data === null) {
        throw new BackupValidationError("Backup enthält keine gültigen Daten.")
    }

    return obj as unknown as BackupData
}

export function restoreBackup(adapter: StorageAdapter, backup: BackupData): void {
    for (const [key, value] of Object.entries(backup.data)) {
        if (value === null) {
            adapter.remove(key)
        } else {
            adapter.set(key, value)
        }
    }
}
