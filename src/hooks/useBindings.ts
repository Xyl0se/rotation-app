/**
 * React hook for loading and correlating bindings with library albums.
 * Provides helpers to check binding status for any album.
 */

import { useState, useEffect, useCallback, useMemo } from "react"
import {
    fetchBindings,
    fetchOrphans,
    type Binding,
} from "../services/api/bindingsService.js"

export interface UseBindingsResult {
    /** All bindings with correlated album data */
    bindings: Binding[]
    /** Bindings that have no matching library album */
    orphans: Binding[]
    /** Whether data is being loaded */
    loading: boolean
    /** Error if loading failed */
    error: string | null
    /** Refresh bindings and orphans */
    refresh: () => void
    /** Check if a given binding (by file albumId) has confirmed state */
    isAlbumBound: (albumId: string) => boolean
    /** Get the binding record for a file albumId (if any) */
    getBindingForAlbum: (albumId: string) => Binding | undefined
    /** Check if a library album (by UUID) has a confirmed binding */
    isLibraryAlbumBound: (libraryAlbumId: string) => boolean
    /** Get the binding record for a library album UUID (if any) */
    getBindingForLibraryAlbum: (libraryAlbumId: string) => Binding | undefined
}

export function useBindings(): UseBindingsResult {
    const [bindings, setBindings] = useState<Binding[]>([])
    const [orphans, setOrphans] = useState<Binding[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const load = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const [allResult, orphansResult] = await Promise.all([
                fetchBindings(),
                fetchOrphans(),
            ])
            setBindings(allResult.bindings)
            setOrphans(orphansResult.bindings)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load bindings")
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        void Promise.resolve().then(load)
    }, [load])

    const refresh = useCallback(() => {
        load()
    }, [load])

    const bindingMap = useMemo(() => {
        const map = new Map<string, Binding>()
        for (const b of bindings) {
            map.set(b.albumId, b)
        }
        return map
    }, [bindings])

    const libraryAlbumBindingMap = useMemo(() => {
        const map = new Map<string, Binding>()
        for (const b of bindings) {
            if (b.libraryAlbumId) {
                map.set(b.libraryAlbumId, b)
            }
        }
        return map
    }, [bindings])

    const isAlbumBound = useCallback(
        (albumId: string): boolean => {
            const binding = bindingMap.get(albumId)
            return binding !== undefined && binding.state === "confirmed"
        },
        [bindingMap],
    )

    const getBindingForAlbum = useCallback(
        (albumId: string): Binding | undefined => {
            return bindingMap.get(albumId)
        },
        [bindingMap],
    )

    const isLibraryAlbumBound = useCallback(
        (libraryAlbumId: string): boolean => {
            const binding = libraryAlbumBindingMap.get(libraryAlbumId)
            return binding !== undefined && binding.state === "confirmed"
        },
        [libraryAlbumBindingMap],
    )

    const getBindingForLibraryAlbum = useCallback(
        (libraryAlbumId: string): Binding | undefined => {
            return libraryAlbumBindingMap.get(libraryAlbumId)
        },
        [libraryAlbumBindingMap],
    )

    return {
        bindings,
        orphans,
        loading,
        error,
        refresh,
        isAlbumBound,
        getBindingForAlbum,
        isLibraryAlbumBound,
        getBindingForLibraryAlbum,
    }
}
