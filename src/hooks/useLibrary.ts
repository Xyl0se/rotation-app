import { useState, useEffect, useCallback } from "react"

import type { Album } from "../types/album"
import type { RoleId } from "../domain/roles"
import type { AlbumRepository } from "../repositories/albumRepository"

import { STORAGE } from "../config/storage"

import {
    saveCustomCover,
    removeCustomCover,
    clearCoverCache,
} from "../repositories/coverCache"

import {
    createAlbum as apiCreateAlbum,
    updateAlbum as apiUpdateAlbum,
    deleteAlbum as apiDeleteAlbum,
} from "../services/api/albumsService"

import {
    uploadCover as apiUploadCover,
    deleteCover as apiDeleteCover,
} from "../services/api/coversService"

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
    adapter: { get(key: string): string | null; set(key: string, value: string): void; remove(key: string): void },
    isConnected: boolean = false,
) {
    const [albums, setAlbums] = useState<Album[]>(() => {
        const loaded = repository.load()
        return loaded.map(normalizeAlbum)
    })

    const [focusAlbumId, setFocusAlbumId] = useState<string | null>(() => {
        const savedFocus = adapter.get(STORAGE.FOCUS_ALBUM)
        return savedFocus ?? null
    })

    useEffect(() => {
        repository.save(albums)
    }, [albums, repository])

    useEffect(() => {
        if (focusAlbumId) {
            adapter.set(STORAGE.FOCUS_ALBUM, focusAlbumId)
        } else {
            adapter.remove(STORAGE.FOCUS_ALBUM)
        }
    }, [focusAlbumId, adapter])

    const pushAlbumToServer = useCallback(async (album: Album) => {
        if (!isConnected) return
        try {
            await apiUpdateAlbum(album)
        } catch {
            // Silent fail – local is source of truth
        }
    }, [isConnected])

    const addAlbum = useCallback((album: Album) => {
        setAlbums(previous => [...previous, album])
        if (isConnected) {
            apiCreateAlbum(album).catch(() => {
                // Silent fail – local is source of truth
            })
        }
    }, [isConnected])

    const deleteAlbum = useCallback(async (id: string) => {
        try {
            await removeCustomCover(id)
        } catch {
            // Ignore – cover deletion is not critical
        }
        if (isConnected) {
            apiDeleteCover(id).catch(() => {})
            apiDeleteAlbum(id).catch(() => {})
        }
        setAlbums(previous =>
            previous.filter(album => album.id !== id)
        )
    }, [isConnected])

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
        pushAlbumToServer(updatedAlbum)
    }, [pushAlbumToServer])

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
            if (updated) {
                pushAlbumToServer(updated)
            }
            return next
        })
    }, [pushAlbumToServer])

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
            if (updated) {
                pushAlbumToServer(updated)
            }
            return next
        })
    }, [pushAlbumToServer])

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
        if (isConnected) {
            apiUploadCover(id, await blob.arrayBuffer(), blob.type).catch(() => {})
        }
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
            if (updated) {
                pushAlbumToServer(updated)
            }
            return next
        })
    }, [isConnected, pushAlbumToServer])

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
            if (updated) {
                pushAlbumToServer(updated)
            }
            return next
        })
    }, [pushAlbumToServer])

    const removeAlbumCoverOverride = useCallback(async (id: string) => {
        await removeCustomCover(id)
        clearCoverCache(id).catch(() => {
            // Ignore – cache invalidation is not critical
        })
        if (isConnected) {
            apiDeleteCover(id).catch(() => {})
        }
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
            if (updated) {
                pushAlbumToServer(updated)
            }
            return next
        })
    }, [isConnected, pushAlbumToServer])

    return {
        albums,
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
