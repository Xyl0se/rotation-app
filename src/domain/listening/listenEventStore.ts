/**
 * ListenEvent Store
 *
 * Loads, saves and migrates listen events.
 * On first start after the update, existing
 * listenCount / lastListened values from albums are defensively
 * back-calculated into events.
 */

import type { Album } from "../../types/album"
import type { StorageAdapter } from "../../adapters/storageAdapter"
import type { ListenEvent } from "./listenEvents"

import { generateUUID } from "../../utils/uuid"

import { STORAGE } from "../../config/storage"

function isString(value: unknown): value is string {
    return typeof value === "string" && value.length > 0
}

function isValidDateString(value: string): boolean {
    return !isNaN(Date.parse(value))
}

function isValidListenEvent(raw: unknown): raw is ListenEvent {
    if (typeof raw !== "object" || raw === null) {
        return false
    }
    const r = raw as Record<string, unknown>
    return (
        isString(r.id) &&
        isString(r.albumId) &&
        isString(r.listenedAt) &&
        isValidDateString(r.listenedAt)
    )
}

export function loadListenEvents(
    adapter: StorageAdapter,
    key: string = STORAGE.LISTEN_EVENTS,
): ListenEvent[] {
    const raw = adapter.get(key)
    if (!raw) {
        return []
    }
    try {
        const parsed = JSON.parse(raw) as unknown[]
        if (Array.isArray(parsed)) {
            return parsed.filter(isValidListenEvent)
        }
    } catch {
        // ignore
    }
    return []
}

export function saveListenEvents(
    adapter: StorageAdapter,
    events: ListenEvent[],
    key: string = STORAGE.LISTEN_EVENTS,
): void {
    adapter.set(key, JSON.stringify(events))
}

export function addListenEvent(
    adapter: StorageAdapter,
    events: ListenEvent[],
    albumId: string,
    key: string = STORAGE.LISTEN_EVENTS,
): ListenEvent[] {
    const newEvent: ListenEvent = {
        id: generateUUID(),
        albumId,
        listenedAt: new Date().toISOString(),
    }
    const updated = [...events, newEvent]
    saveListenEvents(adapter, updated, key)
    return updated
}

export function getEventsForAlbum(
    events: ListenEvent[],
    albumId: string,
): ListenEvent[] {
    return events
        .filter(event => event.albumId === albumId)
        .sort(
            (a, b) =>
                new Date(b.listenedAt).getTime() -
                new Date(a.listenedAt).getTime(),
        )
}

export function countListens(
    events: ListenEvent[],
    albumId: string,
): number {
    return events.filter(event => event.albumId === albumId).length
}

export function lastListened(
    events: ListenEvent[],
    albumId: string,
): string | null {
    const albumEvents = getEventsForAlbum(events, albumId)
    return albumEvents[0]?.listenedAt ?? null
}

/**
 * Defensive Migration:
 * If no events exist, but albums with
 * listenCount / lastListened are present,
 * create one event per album from the last listen date.
 */
export function migrateLegacyListenData(
    adapter: StorageAdapter,
    albums: Album[],
    key: string = STORAGE.LISTEN_EVENTS,
): ListenEvent[] {
    const migrated: ListenEvent[] = []
    for (const album of albums) {
        if (album.lastListened && album.listenCount > 0) {
            migrated.push({
                id: `migrated-${album.id}`,
                albumId: album.id,
                listenedAt: album.lastListened,
            })
        }
    }
    if (migrated.length > 0) {
        saveListenEvents(adapter, migrated, key)
    }
    return migrated
}
