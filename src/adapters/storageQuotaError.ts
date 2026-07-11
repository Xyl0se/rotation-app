/**
 * Normalized error for storage quota problems.
 *
 * Thrown by storage adapters when writing
 * fails (e.g. localStorage full). Not silently
 * swallowed — but visibly reported upward.
 */
export class StorageQuotaError extends Error {
    readonly key: string

    constructor(key: string, cause?: unknown) {
        super(
            `Storage quota exceeded for key "${key}".` +
                (cause instanceof Error ? ` Original: ${cause.message}` : ""),
        )
        this.name = "StorageQuotaError"
        this.key = key
    }
}
