import { fetchCoverUrl } from "../services/api/coversService.js"

const DB_NAME = "rotation-cover-cache"
const DB_VERSION = 2
const STORE_NAME = "covers"
const CUSTOM_STORE_NAME = "customCovers"

function openCoverDb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION)

        request.onerror = () => reject(request.error)
        request.onsuccess = () => resolve(request.result)

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: "albumId" })
            }
            if (!db.objectStoreNames.contains(CUSTOM_STORE_NAME)) {
                db.createObjectStore(CUSTOM_STORE_NAME, { keyPath: "albumId" })
            }
        }
    })
}

/**
 * Retrieves a cached cover entry.
 *
 * Returns an object with blob URL and metadata,
 * or `null` if no cache entry exists.
 */
export async function getCachedCover(
    albumId: string,
): Promise<{ blobUrl: string; sourceUrl: string } | null> {
    const db = await openCoverDb()

    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readonly")
        const store = tx.objectStore(STORE_NAME)
        const request = store.get(albumId)

        request.onsuccess = () => {
            const result = request.result
            if (!result) {
                db.close()
                resolve(null)
                return
            }

            const blob = result.blob as Blob
            if (!blob || blob.size === 0) {
                db.close()
                resolve(null)
                return
            }

            const blobUrl = URL.createObjectURL(blob)
            db.close()
            resolve({
                blobUrl,
                sourceUrl: result.sourceUrl as string,
            })
        }

        request.onerror = () => {
            db.close()
            reject(request.error)
        }
    })
}

/**
 * Downloads a cover and stores it in the cache.
 *
 * Returns a blob URL that can be used directly.
 */
export async function cacheCover(
    albumId: string,
    sourceUrl: string,
): Promise<string> {
    const response = await fetch(sourceUrl)

    if (!response.ok) {
        throw new Error(
            `Cover download failed: ${response.status} ${response.statusText}`,
        )
    }

    const contentType = response.headers.get("content-type") || "image/jpeg"
    const blob = await response.blob()

    if (blob.size === 0) {
        throw new Error("Downloaded cover is empty")
    }

    const db = await openCoverDb()

    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite")
        const store = tx.objectStore(STORE_NAME)

        const entry = {
            albumId,
            sourceUrl,
            blob,
            contentType,
            cachedAt: new Date().toISOString(),
        }

        const request = store.put(entry)

        request.onsuccess = () => {
            const blobUrl = URL.createObjectURL(blob)
            db.close()
            resolve(blobUrl)
        }

        request.onerror = () => {
            db.close()
            reject(request.error)
        }
    })
}

/**
 * Checks whether a cover is cached for an album.
 */
export async function hasCachedCover(albumId: string): Promise<boolean> {
    const cached = await getCachedCover(albumId)
    if (cached) {
        URL.revokeObjectURL(cached.blobUrl)
        return true
    }
    return false
}

/**
 * Resolves the best available cover URL for an album.
 *
 * Priority:
 * 1. Server-side cover (if connected)
 * 2. Local IndexedDB cache
 * 3. Original source URL (fetch and cache)
 *
 * Returns `null` if no cover is available.
 */
export async function resolveCoverUrl(
    albumId: string,
    sourceUrl: string | undefined,
    isConnected: boolean,
): Promise<string | null> {
    if (isConnected) {
        const serverUrl = await fetchCoverUrl(albumId)
        if (serverUrl) {
            return serverUrl
        }
    }

    const cached = await getCachedCover(albumId)
    if (cached) {
        return cached.blobUrl
    }

    if (sourceUrl) {
        try {
            return await cacheCover(albumId, sourceUrl)
        } catch {
            return null
        }
    }

    return null
}

/**
 * Deletes the cover cache for a single album
 * or the entire cache.
 */
export async function clearCoverCache(
    albumId?: string,
): Promise<void> {
    const db = await openCoverDb()

    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite")
        const store = tx.objectStore(STORE_NAME)

        let request: IDBRequest

        if (albumId) {
            request = store.delete(albumId)
        } else {
            request = store.clear()
        }

        request.onsuccess = () => {
            db.close()
            resolve()
        }

        request.onerror = () => {
            db.close()
            reject(request.error)
        }
    })
}

// --- Custom Covers API ---

/**
 * Saves a custom cover blob in IndexedDB.
 *
 * Returns the saved CustomCover object.
 */
export async function saveCustomCover(
    albumId: string,
    blob: Blob,
    options: {
        source?: "upload" | "url" | "alternative"
    } = {},
): Promise<{ albumId: string; blob: Blob; source?: string; fetchedAt: string }> {
    if (blob.size === 0) {
        throw new Error("Custom cover blob is empty")
    }

    const db = await openCoverDb()
    const fetchedAt = new Date().toISOString()

    return new Promise((resolve, reject) => {
        const tx = db.transaction(CUSTOM_STORE_NAME, "readwrite")
        const store = tx.objectStore(CUSTOM_STORE_NAME)

        const entry = {
            albumId,
            blob,
            source: options.source,
            fetchedAt,
        }

        const request = store.put(entry)

        request.onsuccess = () => {
            db.close()
            resolve(entry)
        }

        request.onerror = () => {
            db.close()
            reject(request.error)
        }
    })
}

/**
 * Retrieves a custom cover.
 *
 * Returns an object with blob URL and optional source,
 * or `null` if no custom cover exists.
 */
export async function getCustomCover(
    albumId: string,
): Promise<{ blob: Blob; blobUrl: string; source?: string } | null> {
    const db = await openCoverDb()

    return new Promise((resolve, reject) => {
        const tx = db.transaction(CUSTOM_STORE_NAME, "readonly")
        const store = tx.objectStore(CUSTOM_STORE_NAME)
        const request = store.get(albumId)

        request.onsuccess = () => {
            const result = request.result
            if (!result) {
                db.close()
                resolve(null)
                return
            }

            const blob = result.blob as Blob
            if (!blob || blob.size === 0) {
                db.close()
                resolve(null)
                return
            }

            const blobUrl = URL.createObjectURL(blob)
            db.close()
            resolve({
                blob,
                blobUrl,
                source: result.source as string | undefined,
            })
        }

        request.onerror = () => {
            db.close()
            reject(request.error)
        }
    })
}

/**
 * Deletes a custom cover.
 */
export async function removeCustomCover(
    albumId: string,
): Promise<void> {
    const db = await openCoverDb()

    return new Promise((resolve, reject) => {
        const tx = db.transaction(CUSTOM_STORE_NAME, "readwrite")
        const store = tx.objectStore(CUSTOM_STORE_NAME)

        const request = store.delete(albumId)

        request.onsuccess = () => {
            db.close()
            resolve()
        }

        request.onerror = () => {
            db.close()
            reject(request.error)
        }
    })
}
