import { createContext } from "react"
import type { AlbumSessionState } from "../domain/album-session/albumSessionState.js"

export interface AlbumSessionActions {
    start: (albumId: string) => void
    pause: () => void
    resume: () => void
    stop: () => void
    retry: () => void
    restart: () => void
    dismiss: () => void
}

export interface AlbumSessionContextValue {
    state: AlbumSessionState
    actions: AlbumSessionActions
}

export const AlbumSessionContext = createContext<AlbumSessionContextValue | null>(null)