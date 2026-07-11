/**
 * Entry in the cover cache.
 *
 * Covers are stored as Blob in IndexedDB,
 * to enable offline use and
 * avoid repeated downloads.
 */
export interface CoverCacheEntry {
    /** Album ID as unique key */
    albumId: string

    /** Origin URL of the cover (e.g. Cover Art Archive) */
    sourceUrl: string

    /** Timestamp of caching */
    cachedAt: string

    /** MIME type of the image */
    contentType: string
}
