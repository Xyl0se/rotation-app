import { useCallback, useEffect, useState } from "react"

import type { Album } from "../types/album"
import type { RoleId } from "../domain/roles"
import type { ArchiveReason } from "../domain/album/roleHistory"
import {
    clearCoverCache,
    removeCustomCover,
    saveCustomCover,
} from "../repositories/coverCache"
import {
    createAlbum as apiCreateAlbum,
    deleteAlbum as apiDeleteAlbum,
    fetchAlbums as apiFetchAlbums,
    updateAlbum as apiUpdateAlbum,
} from "../services/api/albumsService"
import {
    deleteCover as apiDeleteCover,
    fetchCoverResolutionStatus,
    resolveServerCover,
    uploadCover as apiUploadCover,
} from "../services/api/coversService"
import type { CoverResolutionDiagnostics } from "../services/api/coversService"

function normalizeAlbum(album: Album): Album {
    return {
        ...album,
        roleHistory: album.roleHistory ?? [],
        listenCount: album.listenCount ?? 0,
        lastListened: album.lastListened ?? null,
        coverOverride: album.coverOverride ?? undefined,
    }
}

/**
 * Server-authoritative Library state.
 *
 * Albums only enter React state after the API has confirmed the mutation. The
 * The server API is the sole Library authority.
 */
export function useLibrary(isConnected: boolean = false) {
    const [albums, setAlbums] = useState<Album[]>([])
    const [isLoading, setIsLoading] = useState(isConnected)
    const [libraryError, setLibraryError] = useState<string | null>(null)

    const refresh = useCallback(async (): Promise<boolean> => {
        if (!isConnected) {
            setLibraryError("Library server is not reachable")
            setIsLoading(false)
            return false
        }
        setIsLoading(true)
        try {
            const serverAlbums = (await apiFetchAlbums()).map(normalizeAlbum)
            setAlbums(serverAlbums)
            setLibraryError(null)
            return true
        } catch (error) {
            setLibraryError(error instanceof Error ? error.message : "Library request failed")
            return false
        } finally {
            setIsLoading(false)
        }
    }, [isConnected])

    useEffect(() => {
        if (isConnected) {
            queueMicrotask(() => void refresh())
        } else {
            queueMicrotask(() => {
                setIsLoading(false)
                setLibraryError("Library server is not reachable")
            })
        }
    }, [isConnected, refresh])

    const runMutation = useCallback(async (
        operation: () => Promise<Album>,
        apply: (confirmed: Album) => void,
    ): Promise<boolean> => {
        if (!isConnected) {
            setLibraryError("Library server is not reachable")
            return false
        }
        try {
            const confirmed = normalizeAlbum(await operation())
            apply(confirmed)
            setLibraryError(null)
            return true
        } catch (error) {
            setLibraryError(error instanceof Error ? error.message : "Library mutation failed")
            return false
        }
    }, [isConnected])

    const addAlbum = useCallback(async (album: Album, coverCandidates: string[] = []): Promise<boolean> =>
        runMutation(
            async () => {
                const candidates = coverCandidates.length > 0
                    ? coverCandidates
                    : (album.coverUrl ? [album.coverUrl] : [])
                return apiCreateAlbum(album, candidates)
            },
            confirmed => setAlbums(previous => [...previous, confirmed]),
        ), [runMutation])

    const updateAlbum = useCallback(async (album: Album): Promise<boolean> =>
        runMutation(
            () => apiUpdateAlbum(album),
            confirmed => setAlbums(previous => previous.map(existing =>
                existing.id === confirmed.id ? confirmed : existing,
            )),
        ), [runMutation])

    const deleteAlbum = useCallback(async (id: string): Promise<boolean> => {
        if (!isConnected) {
            setLibraryError("Library server is not reachable")
            return false
        }
        try {
            await apiDeleteAlbum(id)
            await removeCustomCover(id).catch(() => undefined)
            await clearCoverCache(id).catch(() => undefined)
            setAlbums(previous => previous.filter(album => album.id !== id))
            setLibraryError(null)
            return true
        } catch (error) {
            setLibraryError(error instanceof Error ? error.message : "Library deletion failed")
            return false
        }
    }, [isConnected])

    const updateAlbumRole = useCallback(async (
        id: string,
        role: RoleId,
        source: "coach" | "reflection" | "archive",
        archiveReason?: ArchiveReason,
    ): Promise<boolean> => {
        const current = albums.find(album => album.id === id)
        if (!current) return false
        return updateAlbum({
            ...current,
            category: role,
            roleHistory: [...current.roleHistory, {
                role,
                source,
                recordedAt: new Date().toISOString(),
                ...(role === "archive" && archiveReason ? { archiveReason } : {}),
            }],
        })
    }, [albums, updateAlbum])

    const logListenForAlbum = useCallback(async (id: string): Promise<boolean> => {
        const current = albums.find(album => album.id === id)
        if (!current) return false
        return updateAlbum({
            ...current,
            listenCount: current.listenCount + 1,
            lastListened: new Date().toISOString(),
        })
    }, [albums, updateAlbum])

    const updateAlbumCoverOverride = useCallback(async (
        id: string,
        blob: Blob,
        source: "upload" | "alternative",
    ): Promise<boolean> => {
        const current = albums.find(album => album.id === id)
        if (!current || !isConnected) return false
        try {
            await apiUploadCover(id, await blob.arrayBuffer(), blob.type)
            const cached = await saveCustomCover(id, blob, { source })
            await clearCoverCache(id).catch(() => undefined)
            return updateAlbum({
                ...current,
                coverOverride: {
                    type: "custom",
                    albumId: id,
                    blobUrl: URL.createObjectURL(blob),
                    source,
                    fetchedAt: cached.fetchedAt,
                },
            })
        } catch (error) {
            setLibraryError(error instanceof Error ? error.message : "Cover upload failed")
            return false
        }
    }, [albums, isConnected, updateAlbum])

    const removeAlbumCoverOverride = useCallback(async (id: string): Promise<boolean> => {
        const current = albums.find(album => album.id === id)
        if (!current || !isConnected) return false
        try {
            await apiDeleteCover(id)
            await removeCustomCover(id).catch(() => undefined)
            await clearCoverCache(id).catch(() => undefined)
            return updateAlbum({ ...current, coverOverride: undefined })
        } catch (error) {
            setLibraryError(error instanceof Error ? error.message : "Cover deletion failed")
            return false
        }
    }, [albums, isConnected, updateAlbum])

    const retryAlbumCover = useCallback(async (id: string): Promise<CoverResolutionDiagnostics | null> => {
        const current = albums.find(album => album.id === id)
        if (!current || !isConnected) return null
        try {
            const result = await resolveServerCover(id, [], true)
            const diagnostics = await fetchCoverResolutionStatus(id)
            if (result.status !== "cached") {
                setLibraryError(`Cover resolution failed: ${result.status}`)
                return diagnostics
            }
            await clearCoverCache(id).catch(() => undefined)
            setLibraryError(null)
            return diagnostics
        } catch (error) {
            setLibraryError(error instanceof Error ? error.message : "Cover resolution failed")
            return null
        }
    }, [albums, isConnected])

    return {
        albums,
        isLoading,
        libraryError,
        refresh,
        addAlbum,
        deleteAlbum,
        updateAlbum,
        updateAlbumRole,
        logListenForAlbum,
        updateAlbumCoverOverride,
        removeAlbumCoverOverride,
        retryAlbumCover,
    }
}
