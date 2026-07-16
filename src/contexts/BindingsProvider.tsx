import { useState, useEffect, useCallback, useMemo } from "react"
import type { ReactNode } from "react"
import { fetchBindings, fetchOrphans, type Binding } from "../services/api/bindingsService.js"
import { BindingsContext, type BindingsState } from "./bindingsState"

export function BindingsProvider({ children }: { children: ReactNode }) {
    const [bindings, setBindings] = useState<Binding[]>([])
    const [orphans, setOrphans] = useState<Binding[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const load = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const [allResult, orphansResult] = await Promise.all([fetchBindings(), fetchOrphans()])
            setBindings(allResult.bindings)
            setOrphans(orphansResult.bindings)
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : "Failed to load bindings")
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        void Promise.resolve().then(load)
    }, [load])

    const refresh = useCallback(() => { void load() }, [load])

    const bindingMap = useMemo(() => new Map(bindings.map(binding => [binding.albumId, binding])), [bindings])
    const libraryAlbumBindingMap = useMemo(() => new Map(
        bindings.flatMap(binding => binding.libraryAlbumId ? [[binding.libraryAlbumId, binding] as const] : []),
    ), [bindings])

    const value = useMemo<BindingsState>(() => ({
        bindings,
        orphans,
        loading,
        error,
        refresh,
        isAlbumBound: albumId => bindingMap.get(albumId)?.state === "confirmed",
        getBindingForAlbum: albumId => bindingMap.get(albumId),
        isLibraryAlbumBound: libraryAlbumId => libraryAlbumBindingMap.get(libraryAlbumId)?.state === "confirmed",
        getBindingForLibraryAlbum: libraryAlbumId => libraryAlbumBindingMap.get(libraryAlbumId),
    }), [bindings, orphans, loading, error, refresh, bindingMap, libraryAlbumBindingMap])

    return <BindingsContext.Provider value={value}>{children}</BindingsContext.Provider>
}
