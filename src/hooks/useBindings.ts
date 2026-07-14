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
    /** Check if a given album has a confirmed binding */
    isAlbumBound: (albumId: string) => boolean
    /** Get the binding record for an album (if any) */
    getBindingForAlbum: (albumId: string) => Binding | undefined
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
        load()
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

    return {
        bindings,
        orphans,
        loading,
        error,
        refresh,
        isAlbumBound,
        getBindingForAlbum,
    }
}
