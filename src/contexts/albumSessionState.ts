import { createContext } from "react"
import type { AlbumSessionState } from "../domain/album-session/albumSessionState.js"
import type { ListenEvent } from "../domain/listening/listenEvents.js"

export interface AlbumSessionActions {
    start: (albumId: string) => void
    pause: () => void
    resume: () => void
    stop: () => void
    retry: () => void
    restart: () => void
    dismiss: () => void
    dismissCompletedEvent: () => void
}

export interface AlbumSessionContextValue {
    state: AlbumSessionState
    completedEvent: ListenEvent | null
    actions: AlbumSessionActions
}

export const AlbumSessionContext = createContext<AlbumSessionContextValue | null>(null)
