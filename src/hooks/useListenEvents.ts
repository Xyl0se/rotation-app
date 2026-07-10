import { useState, useEffect, useCallback } from "react"

import type { Album } from "../types/album"
import type { ListenEventRepository } from "../repositories/listenEventRepository"
import type { ListenEvent } from "../domain/listening/listenEvents"
import type { StorageAdapter } from "../adapters/storageAdapter"

import { migrateLegacyListenData } from "../domain/listening/listenEventStore"

export function useListenEvents(
    repository: ListenEventRepository,
    albums: Album[],
    adapter: StorageAdapter,
) {
    const [listenEvents, setListenEvents] = useState<ListenEvent[]>(() => {
        const events = repository.load()
        if (events.length > 0) {
            return events
        }
        const migrated = migrateLegacyListenData(adapter, albums)
        return migrated
    })

    useEffect(() => {
        repository.save(listenEvents)
    }, [listenEvents, repository])

    const logListen = useCallback((albumId: string) => {
        setListenEvents(previous => {
            const newEvent: ListenEvent = {
                id: crypto.randomUUID(),
                albumId,
                listenedAt: new Date().toISOString(),
            }
            return [...previous, newEvent]
        })
    }, [])

    return {
        listenEvents,
        logListen,
    }
}
