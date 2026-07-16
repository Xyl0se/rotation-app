import { useState, useEffect, useCallback } from "react"
import { generateUUID } from "../utils/uuid"

import type { Album } from "../types/album"
import type { ListenEvent } from "../domain/listening/listenEvents"
import { createListenEvent, fetchListenEvents } from "../services/api/rotationStateService"

export function useListenEvents(
    _albums: Album[],
    isConnected: boolean,
) {
    const [listenEvents, setListenEvents] = useState<ListenEvent[]>([])
    const [isLoading, setIsLoading] = useState(isConnected)
    const [error, setError] = useState<string | null>(null)

    const refresh = useCallback(async () => {
        if (!isConnected) return false
        setIsLoading(true)
        try {
            setListenEvents(await fetchListenEvents())
            setError(null)
            return true
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : "Listening history request failed")
            return false
        } finally {
            setIsLoading(false)
        }
    }, [isConnected])

    useEffect(() => {
        if (isConnected) queueMicrotask(() => void refresh())
    }, [isConnected, refresh])

    const logListen = useCallback(async (albumId: string) => {
        const event: ListenEvent = { id: generateUUID(), albumId, listenedAt: new Date().toISOString() }
        try {
            const confirmed = await createListenEvent(event)
            setListenEvents(previous => [...previous, confirmed])
            setError(null)
            return true
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : "Listening history mutation failed")
            return false
        }
    }, [])

    return {
        listenEvents,
        logListen,
        isLoading,
        error,
        refresh,
    }
}
