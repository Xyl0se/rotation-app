import type { StorageAdapter } from "./storageAdapter"

/**
 * In-memory adapter for tests and Storybook.
 * Keeps all values in an internal Map and is lost
 * on tab switch or reload.
 */
export function createMemoryStorageAdapter(): StorageAdapter {
    const store = new Map<string, string>()

    return {
        get(key: string): string | null {
            return store.get(key) ?? null
        },
        set(key: string, value: string): void {
            store.set(key, value)
        },
        remove(key: string): void {
            store.delete(key)
        },
        clear(): void {
            store.clear()
        },
        keys(): string[] {
            return Array.from(store.keys())
        },
    }
}
