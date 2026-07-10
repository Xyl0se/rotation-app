import type { StorageAdapter } from "../adapters/storageAdapter"

export const SCHEMA_VERSION = "2"

export const STORAGE_VERSION = "rotation-schema-version"

export function getStoredSchemaVersion(
    adapter: StorageAdapter,
): string | null {
    return adapter.get(STORAGE_VERSION)
}

export function setStoredSchemaVersion(
    adapter: StorageAdapter,
    version: string,
): void {
    adapter.set(STORAGE_VERSION, version)
}
