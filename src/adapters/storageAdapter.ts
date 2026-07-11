/**
 * Abstract interface for all storage operations.
 * Enables swapping localStorage for
 * in-memory implementations in tests or Storybook.
 */
export interface StorageAdapter {
    get(key: string): string | null
    set(key: string, value: string): void
    remove(key: string): void
    clear(): void
    keys(): string[]
}
