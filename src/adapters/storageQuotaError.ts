/**
 * Normalisierter Fehler für Speicher-Quota-Probleme.
 *
 * Wird von Storage-Adaptern geworfen, wenn das Schreiben
 * fehlschlägt (z.B. localStorage voll). Nicht stillschweigend
 * geschluckt — sondern sichtbar nach oben gemeldet.
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
