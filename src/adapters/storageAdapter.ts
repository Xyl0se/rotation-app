/**
 * Abstraktes Interface für alle Speicheroperationen.
 * Ermöglicht das Austauschen von localStorage gegen
 * In-Memory-Implementierungen in Tests oder Storybook.
 */
export interface StorageAdapter {
    get(key: string): string | null
    set(key: string, value: string): void
    remove(key: string): void
    clear(): void
    keys(): string[]
}
