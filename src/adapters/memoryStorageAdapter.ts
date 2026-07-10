import type { StorageAdapter } from "./storageAdapter"

/**
 * In-Memory-Adapter für Tests und Storybook.
 * Hält alle Werte in einem internen Map und geht
 * bei Tab-Wechsel oder Reload verloren.
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
