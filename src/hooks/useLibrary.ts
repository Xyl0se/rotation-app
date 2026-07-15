import { useState, useEffect, useCallback, useRef } from "react"

import type { Album } from "../types/album"
import type { RoleId } from "../domain/roles"
import type { AlbumRepository } from "../repositories/albumRepository"
import type { StorageAdapter } from "../adapters/storageAdapter"

import { STORAGE } from "../config/storage"

import {
    saveCustomCover,
    getCustomCover,
    removeCustomCover,
    clearCoverCache,
} from "../repositories/coverCache"

import {
    fetchAlbums as apiFetchAlbums,
    importAlbums as apiImportAlbums,
    deleteAlbum as apiDeleteAlbum,
} from "../services/api/albumsService"

import {
    uploadCover as apiUploadCover,
    deleteCover as apiDeleteCover,
} from "../services/api/coversService"
import { ApiError } from "../services/api/apiClient"
import {
    completeLibraryOperation,
    enqueueLibraryOperation,
    loadPendingLibraryOperations,
} from "../repositories/pendingLibraryOperations"

export type LibraryPersistenceMode = "cache" | "server" | "migrating"

interface ServerBootstrapResult {
    albums: Album[]
    mode: "server"
}

function normalizeAlbum(album: Album): Album {
    return {
        ...album,
        roleHistory: album.roleHistory ?? [],
        listenCount: album.listenCount ?? 0,
        lastListened: album.lastListened ?? null,
        coverOverride: album.coverOverride ?? undefined,
    }
}

export function useLibrary(
    repository: AlbumRepository,
    adapter: StorageAdapter,
    isConnected: boolean = false,
) {
    const [albums, setAlbums] = useState<Album[]>(() => {
        const loaded = repository.load()
        return loaded.map(normalizeAlbum)
    })
    const [isLoading, setIsLoading] = useState(isConnected)
    const [persistenceMode, setPersistenceMode] = useState<LibraryPersistenceMode>("cache")
    const [syncError, setSyncError] = useState<string | null>(null)
    const [pendingOperationCount, setPendingOperationCount] = useState(() =>
        loadPendingLibraryOperations(adapter).length,
    )
    const [lastSuccessfulSyncAt, setLastSuccessfulSyncAt] = useState<string | null>(null)
    const bootstrapRef = useRef<Promise<ServerBootstrapResult> | null>(null)
    const bootstrapAppliedRef = useRef(false)
    const flushRef = useRef<Promise<boolean> | null>(null)

    const [focusAlbumId, setFocusAlbumId] = useState<string | null>(() => {
        const savedFocus = adapter.get(STORAGE.FOCUS_ALBUM)
        return savedFocus ?? null
    })

    useEffect(() => {
        repository.save(albums)
    }, [albums, repository])

    const flushPendingOperations = useCallback(async (): Promise<boolean> => {
        if (!isConnected) return false
        if (flushRef.current) return flushRef.current

        const run = async (): Promise<boolean> => {
            while (true) {
                const operation = loadPendingLibraryOperations(adapter)[0]
                if (!operation) {
                    setPendingOperationCount(0)
                    setSyncError(null)
                    setLastSuccessfulSyncAt(new Date().toISOString())
                    return true
                }

                try {
                    if (operation.kind === "upsert") {
                        const result = await apiImportAlbums([operation.album])
                        if (result.failed > 0) throw new Error("Server rejected album synchronization")
                    } else if (operation.kind === "delete") {
                        try {
                            await apiDeleteAlbum(operation.albumId)
                        } catch (error) {
                            if (!(error instanceof ApiError && error.status === 404)) throw error
                        }
                    } else if (operation.kind === "cover-upload") {
                        const customCover = await getCustomCover(operation.albumId)
                        if (!customCover) throw new Error("Pending cover data is unavailable")
                        await apiUploadCover(
                            operation.albumId,
                            await customCover.blob.arrayBuffer(),
                            customCover.blob.type,
                        )
                    } else {
                        try {
                            await apiDeleteCover(operation.albumId)
                        } catch (error) {
                            if (!(error instanceof ApiError && error.status === 404)) throw error
                        }
                    }
                    completeLibraryOperation(adapter, operation)
                    setPendingOperationCount(loadPendingLibraryOperations(adapter).length)
                } catch (error) {
                    setSyncError(error instanceof Error ? error.message : "Library synchronization failed")
                    setPendingOperationCount(loadPendingLibraryOperations(adapter).length)
                    return false
                }
            }
        }

        const promise = run().finally(() => {
            if (flushRef.current === promise) flushRef.current = null
        })
        flushRef.current = promise
        return promise
    }, [adapter, isConnected])

    const enqueue = useCallback((operation: Parameters<typeof enqueueLibraryOperation>[1]) => {
        enqueueLibraryOperation(adapter, operation)
        setPendingOperationCount(loadPendingLibraryOperations(adapter).length)
        void flushPendingOperations()
    }, [adapter, flushPendingOperations])

    useEffect(() => {
        if (!isConnected) {
            bootstrapRef.current = null
            bootstrapAppliedRef.current = false
            queueMicrotask(() => setIsLoading(false))
            return
        }

        let active = true
        if (!bootstrapRef.current) {
            const cachedAlbums = repository.load().map(normalizeAlbum)
            bootstrapRef.current = (async () => {
                if (loadPendingLibraryOperations(adapter).length > 0) {
                    const flushed = await flushPendingOperations()
                    if (!flushed) throw new Error("Pending Library synchronization failed")
                }
                const serverAlbums = (await apiFetchAlbums()).map(normalizeAlbum)
                if (serverAlbums.length > 0 || cachedAlbums.length === 0) {
                    return { albums: serverAlbums, mode: "server" }
                }

                const migrationComplete = adapter.get(STORAGE.LIBRARY_SERVER_MIGRATION) === "complete"
                if (!migrationComplete) {
                    if (active) setPersistenceMode("migrating")
                    await apiImportAlbums(cachedAlbums)
                    const verifiedAlbums = (await apiFetchAlbums()).map(normalizeAlbum)
                    const verifiedIds = new Set(verifiedAlbums.map((album) => album.id))
                    if (
                        verifiedAlbums.length !== cachedAlbums.length
                        || cachedAlbums.some((album) => !verifiedIds.has(album.id))
                    ) {
                        throw new Error("Server migration verification failed")
                    }
                    adapter.set(STORAGE.LIBRARY_SERVER_MIGRATION, "complete")
                    return { albums: verifiedAlbums, mode: "server" }
                }

                throw new Error("Server Library is empty after a completed migration")
            })()
        }

        queueMicrotask(() => {
            if (active) setIsLoading(true)
        })
        bootstrapRef.current
            .then((result) => {
                if (!active || bootstrapAppliedRef.current) return
                bootstrapAppliedRef.current = true
                setAlbums(result.albums)
                setPersistenceMode(result.mode)
                setSyncError(null)
            })
            .catch((error: unknown) => {
                if (!active || bootstrapAppliedRef.current) return
                bootstrapAppliedRef.current = true
                setPersistenceMode("cache")
                setSyncError(error instanceof Error ? error.message : "Library synchronization failed")
            })
            .finally(() => {
                if (active) setIsLoading(false)
            })

        return () => {
            active = false
        }
    }, [isConnected, repository, adapter, flushPendingOperations])

    useEffect(() => {
        if (focusAlbumId) {
            adapter.set(STORAGE.FOCUS_ALBUM, focusAlbumId)
        } else {
            adapter.remove(STORAGE.FOCUS_ALBUM)
        }
    }, [focusAlbumId, adapter])

    const addAlbum = useCallback((album: Album) => {
        setAlbums(previous => [...previous, album])
        enqueue({ kind: "upsert", albumId: album.id, album })
    }, [enqueue])

    const deleteAlbum = useCallback(async (id: string) => {
        try {
            await removeCustomCover(id)
        } catch {
            // Ignore – cover deletion is not critical
        }
        setAlbums(previous =>
            previous.filter(album => album.id !== id)
        )
        enqueue({ kind: "cover-delete", albumId: id })
        enqueue({ kind: "delete", albumId: id })
    }, [enqueue])

    const updateAlbum = useCallback((updatedAlbum: Album) => {
        setAlbums(previous => {
            const previousAlbum = previous.find(
                album => album.id === updatedAlbum.id
            )
            if (
                previousAlbum
                && previousAlbum.coverUrl !== updatedAlbum.coverUrl
            ) {
                clearCoverCache(updatedAlbum.id).catch(() => {
                    // Ignore – cache invalidation is not critical
                })
            }
            return previous.map(album =>
                album.id === updatedAlbum.id
                    ? updatedAlbum
                    : album
            )
        })
        enqueue({ kind: "upsert", albumId: updatedAlbum.id, album: updatedAlbum })
    }, [enqueue])

    const updateAlbumRole = useCallback((
        id: string,
        role: RoleId,
        source: "reflection" | "archive",
    ) => {
        const recordedAt = new Date().toISOString()
        setAlbums(previous => {
            const next = previous.map(album => {
                if (album.id !== id) {
                    return album
                }
                return {
                    ...album,
                    category: role,
                    roleHistory: [
                        ...album.roleHistory,
                        {
                            role,
                            recordedAt,
                            source,
                        },
                    ],
                }
            })
            const updated = next.find(a => a.id === id)
            if (updated) enqueue({ kind: "upsert", albumId: id, album: updated })
            return next
        })
    }, [enqueue])

    const logListenForAlbum = useCallback((id: string) => {
        const today = new Date().toISOString()
        setAlbums(previous => {
            const next = previous.map(album => {
                if (album.id !== id) {
                    return album
                }
                return {
                    ...album,
                    listenCount: album.listenCount + 1,
                    lastListened: today,
                }
            })
            const updated = next.find(a => a.id === id)
            if (updated) enqueue({ kind: "upsert", albumId: id, album: updated })
            return next
        })
    }, [enqueue])

    const updateAlbumCoverOverride = useCallback(async (
        id: string,
        blob: Blob,
        source: "upload" | "alternative",
    ) => {
        const customCover = await saveCustomCover(id, blob, { source })
        const blobUrl = URL.createObjectURL(blob)
        clearCoverCache(id).catch(() => {
            // Ignore – cache invalidation is not critical
        })
        enqueue({ kind: "cover-upload", albumId: id })
        setAlbums(previous => {
            const next = previous.map(album => {
                if (album.id !== id) {
                    return album
                }
                return {
                    ...album,
                    coverOverride: {
                        type: "custom" as const,
                        albumId: id,
                        blobUrl,
                        source,
                        fetchedAt: customCover.fetchedAt,
                    },
                }
            })
            const updated = next.find(a => a.id === id)
            if (updated) enqueue({ kind: "upsert", albumId: id, album: updated })
            return next
        })
    }, [enqueue])

    const setCoverUrlOverride = useCallback(async (
        id: string,
        url: string,
    ) => {
        clearCoverCache(id).catch(() => {
            // Ignore – cache invalidation is not critical
        })
        setAlbums(previous => {
            const next = previous.map(album => {
                if (album.id !== id) {
                    return album
                }
                return {
                    ...album,
                    coverOverride: {
                        type: "url" as const,
                        albumId: id,
                        url,
                        fetchedAt: new Date().toISOString(),
                    },
                }
            })
            const updated = next.find(a => a.id === id)
            if (updated) enqueue({ kind: "upsert", albumId: id, album: updated })
            return next
        })
    }, [enqueue])

    const removeAlbumCoverOverride = useCallback(async (id: string) => {
        await removeCustomCover(id)
        clearCoverCache(id).catch(() => {
            // Ignore – cache invalidation is not critical
        })
        enqueue({ kind: "cover-delete", albumId: id })
        setAlbums(previous => {
            const next = previous.map(album => {
                if (album.id !== id) {
                    return album
                }
                return {
                    ...album,
                    coverOverride: undefined,
                }
            })
            const updated = next.find(a => a.id === id)
            if (updated) enqueue({ kind: "upsert", albumId: id, album: updated })
            return next
        })
    }, [enqueue])

    return {
        albums,
        isLoading,
        persistenceMode,
        syncError,
        pendingOperationCount,
        lastSuccessfulSyncAt,
        retrySynchronization: flushPendingOperations,
        focusAlbumId,
        setFocusAlbumId,
        addAlbum,
        deleteAlbum,
        updateAlbum,
        updateAlbumRole,
        logListenForAlbum,
        updateAlbumCoverOverride,
        setCoverUrlOverride,
        removeAlbumCoverOverride,
    }
}
