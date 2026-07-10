import type { ListenEvent } from "../domain/listening/listenEvents"
import type { StorageAdapter } from "../adapters/storageAdapter"
import { STORAGE } from "../config/storage"

import {
    loadListenEvents,
    saveListenEvents,
    addListenEvent,
} from "../domain/listening/listenEventStore"

export interface ListenEventRepository {
    load(): ListenEvent[]
    save(events: ListenEvent[]): void
    add(events: ListenEvent[], albumId: string): ListenEvent[]
    clear(): void
}

export function createListenEventRepository(
    adapter: StorageAdapter,
    key: string = STORAGE.LISTEN_EVENTS,
): ListenEventRepository {
    return {
        load(): ListenEvent[] {
            return loadListenEvents(adapter, key)
        },
        save(events: ListenEvent[]): void {
            saveListenEvents(adapter, events, key)
        },
        add(events: ListenEvent[], albumId: string): ListenEvent[] {
            return addListenEvent(adapter, events, albumId, key)
        },
        clear(): void {
            saveListenEvents(adapter, [], key)
        },
    }
}
