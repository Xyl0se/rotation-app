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
 * Ruft einen gecachten Cover-Eintrag ab.
 *
 * Gibt ein Objekt mit Blob-URL und Metadaten zurück,
 * oder `null`, wenn kein Cache-Eintrag existiert.
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
 * Lädt ein Cover herunter und speichert es im Cache.
 *
 * Gibt eine Blob-URL zurück, die direkt verwendet werden kann.
 */
export async function cacheCover(
    albumId: string,
    sourceUrl: string,
): Promise<string> {
    const response = await fetch(sourceUrl)

    if (!response.ok) {
        throw new Error(
            `Cover-Download fehlgeschlagen: ${response.status} ${response.statusText}`,
        )
    }

    const contentType = response.headers.get("content-type") || "image/jpeg"
    const blob = await response.blob()

    if (blob.size === 0) {
        throw new Error("Heruntergeladenes Cover ist leer")
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
 * Prüft, ob ein Cover für ein Album gecacht ist.
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
 * Löscht den Cover-Cache für ein einzelnes Album
 * oder den gesamten Cache.
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
 * Speichert ein benutzerdefiniertes Cover-Blob in IndexedDB.
 *
 * Gibt das gespeicherte CustomCover-Objekt zurück.
 */
export async function saveCustomCover(
    albumId: string,
    blob: Blob,
    options: {
        source?: "upload" | "url" | "alternative"
    } = {},
): Promise<{ albumId: string; blob: Blob; source?: string; fetchedAt: string }> {
    if (blob.size === 0) {
        throw new Error("Custom-Cover-Blob ist leer")
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
 * Ruft ein benutzerdefiniertes Cover ab.
 *
 * Gibt ein Objekt mit Blob-URL und optionaler Source zurück,
 * oder `null`, wenn kein Custom Cover existiert.
 */
export async function getCustomCover(
    albumId: string,
): Promise<{ blobUrl: string; source?: string } | null> {
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
 * Löscht ein benutzerdefiniertes Cover.
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
