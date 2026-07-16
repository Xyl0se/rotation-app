import { createContext } from "react"
import type { Binding } from "../services/api/bindingsService.js"

export interface BindingsState {
    bindings: Binding[]
    orphans: Binding[]
    loading: boolean
    error: string | null
    refresh: () => void
    isAlbumBound: (albumId: string) => boolean
    getBindingForAlbum: (albumId: string) => Binding | undefined
    isLibraryAlbumBound: (libraryAlbumId: string) => boolean
    getBindingForLibraryAlbum: (libraryAlbumId: string) => Binding | undefined
}

export const BindingsContext = createContext<BindingsState | null>(null)
