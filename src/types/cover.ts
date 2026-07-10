/**
 * Eintrag im Cover-Cache.
 *
 * Cover werden als Blob in IndexedDB gespeichert,
 * um Offline-Nutzung zu ermöglichen und
 * wiederholte Downloads zu vermeiden.
 */
export interface CoverCacheEntry {
    /** Album-ID als eindeutiger Schlüssel */
    albumId: string

    /** Herkunfts-URL des Covers (z. B. Cover Art Archive) */
    sourceUrl: string

    /** Zeitpunkt des Caching */
    cachedAt: string

    /** MIME-Typ des Bildes */
    contentType: string
}
