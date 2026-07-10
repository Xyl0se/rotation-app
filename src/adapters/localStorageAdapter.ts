import type { StorageAdapter } from "./storageAdapter"
import { StorageQuotaError } from "./storageQuotaError"

/**
 * Produktions-Adapter: Nutzt den Browser-localStorage.
 *
 * Schreibfehler (z.B. QuotaExceededError) werden nicht
 * stillschweigend geschluckt, sondern als normalisierter
 * StorageQuotaError nach oben gemeldet.
 */
export function createLocalStorageAdapter(): StorageAdapter {
    return {
        get(key: string): string | null {
            return localStorage.getItem(key)
        },
        set(key: string, value: string): void {
            try {
                localStorage.setItem(key, value)
            } catch (error) {
                if (
                    error instanceof DOMException &&
                    (error.name === "QuotaExceededError" ||
                        error.name === "NS_ERROR_DOM_QUOTA_REACHED")
                ) {
                    throw new StorageQuotaError(key, error)
                }
                throw error
            }
        },
        remove(key: string): void {
            localStorage.removeItem(key)
        },
        clear(): void {
            localStorage.clear()
        },
        keys(): string[] {
            const result: string[] = []
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i)
                if (key !== null) {
                    result.push(key)
                }
            }
            return result
        },
    }
}
