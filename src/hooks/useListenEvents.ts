import { useState, useEffect, useCallback } from "react"
import { generateUUID } from "../utils/uuid"

import type { Album } from "../types/album"
import type { ListenEvent } from "../domain/listening/listenEvents"
import { createListenEvent, deleteListeningJournal, fetchListenEvents, saveListeningJournal } from "../services/api/rotationStateService"

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
            return confirmed
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : "Listening history mutation failed")
            return null
        }
    }, [])

    const saveJournal=useCallback(async(id:string,journal:Pick<NonNullable<ListenEvent["journal"]>,"note"|"moodTags"|"contextTags">)=>{
        try{const confirmed=await saveListeningJournal(id,journal);setListenEvents(current=>current.map(event=>event.id===id?confirmed:event));setError(null);return true}
        catch(cause){setError(cause instanceof Error?cause.message:"Journal save failed");return false}
    },[])
    const deleteJournal=useCallback(async(id:string)=>{
        try{await deleteListeningJournal(id);setListenEvents(current=>current.map(event=>event.id===id?{...event,journal:undefined}:event));setError(null);return true}
        catch(cause){setError(cause instanceof Error?cause.message:"Journal deletion failed");return false}
    },[])

    return {
        listenEvents,
        logListen,
        saveJournal,
        deleteJournal,
        isLoading,
        error,
        refresh,
    }
}
