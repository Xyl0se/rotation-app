import { describe, expect, it, beforeEach } from "vitest"
import { createMemoryStorageAdapter } from "../../adapters/memoryStorageAdapter"
import {
    loadListenEvents,
    saveListenEvents,
    addListenEvent,
    getEventsForAlbum,
    countListens,
    lastListened,
} from "./listenEventStore"
import { STORAGE } from "../../config/storage"
import type { ListenEvent } from "./listenEvents"

function makeEvent(partial: Partial<ListenEvent> = {}): ListenEvent {
    return {
        id: "evt-1",
        albumId: "album-1",
        listenedAt: "2024-06-15T10:00:00Z",
        ...partial,
    }
}

describe("listenEventStore", () => {
    let adapter = createMemoryStorageAdapter()

    beforeEach(() => {
        adapter = createMemoryStorageAdapter()
    })

    it("returns empty array when no data", () => {
        expect(loadListenEvents(adapter)).toEqual([])
    })

    it("loads valid events", () => {
        const events = [makeEvent()]
        adapter.set(STORAGE.LISTEN_EVENTS, JSON.stringify(events))
        expect(loadListenEvents(adapter)).toEqual(events)
    })

    it("returns empty array for invalid JSON", () => {
        adapter.set(STORAGE.LISTEN_EVENTS, "not-json")
        expect(loadListenEvents(adapter)).toEqual([])
    })

    it("returns empty array when data is not an array", () => {
        adapter.set(STORAGE.LISTEN_EVENTS, JSON.stringify({ id: "evt" }))
        expect(loadListenEvents(adapter)).toEqual([])
    })

    it("filters out events with missing fields", () => {
        const events = [
            makeEvent(),
            { id: "evt-2", albumId: "album-1" },
            makeEvent({ id: "evt-3" }),
        ]
        adapter.set(STORAGE.LISTEN_EVENTS, JSON.stringify(events))
        const loaded = loadListenEvents(adapter)
        expect(loaded).toHaveLength(2)
        expect(loaded[0].id).toBe("evt-1")
        expect(loaded[1].id).toBe("evt-3")
    })

    it("filters out events with invalid listenedAt date", () => {
        const events = [
            makeEvent(),
            makeEvent({ id: "evt-2", listenedAt: "not-a-date" }),
            makeEvent({ id: "evt-3", listenedAt: "2024-01-01T00:00:00Z" }),
        ]
        adapter.set(STORAGE.LISTEN_EVENTS, JSON.stringify(events))
        const loaded = loadListenEvents(adapter)
        expect(loaded).toHaveLength(2)
        expect(loaded.map(e => e.id)).toEqual(["evt-1", "evt-3"])
    })

    it("saves events", () => {
        const events = [makeEvent()]
        saveListenEvents(adapter, events)
        expect(adapter.get(STORAGE.LISTEN_EVENTS)).toBe(JSON.stringify(events))
    })

    it("adds a new event and returns updated list", () => {
        const events = [makeEvent()]
        const updated = addListenEvent(adapter, events, "album-2")
        expect(updated).toHaveLength(2)
        expect(updated[1].albumId).toBe("album-2")
        expect(updated[1].listenedAt).toBeDefined()
    })

    it("getEventsForAlbum returns events sorted by date descending", () => {
        const events = [
            makeEvent({ albumId: "a1", listenedAt: "2024-01-01T00:00:00Z" }),
            makeEvent({ albumId: "a1", listenedAt: "2024-06-01T00:00:00Z" }),
            makeEvent({ albumId: "a2", listenedAt: "2024-03-01T00:00:00Z" }),
        ]
        const result = getEventsForAlbum(events, "a1")
        expect(result).toHaveLength(2)
        expect(result[0].listenedAt).toBe("2024-06-01T00:00:00Z")
        expect(result[1].listenedAt).toBe("2024-01-01T00:00:00Z")
    })

    it("countListens returns correct count", () => {
        const events = [
            makeEvent({ albumId: "a1" }),
            makeEvent({ albumId: "a1" }),
            makeEvent({ albumId: "a2" }),
        ]
        expect(countListens(events, "a1")).toBe(2)
        expect(countListens(events, "a2")).toBe(1)
        expect(countListens(events, "a3")).toBe(0)
    })

    it("lastListened returns most recent date", () => {
        const events = [
            makeEvent({ albumId: "a1", listenedAt: "2024-01-01T00:00:00Z" }),
            makeEvent({ albumId: "a1", listenedAt: "2024-06-01T00:00:00Z" }),
        ]
        expect(lastListened(events, "a1")).toBe("2024-06-01T00:00:00Z")
    })

    it("lastListened returns null when no events", () => {
        expect(lastListened([], "a1")).toBeNull()
    })
})
