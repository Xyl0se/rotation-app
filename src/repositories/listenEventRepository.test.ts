import { describe, it, expect, beforeEach } from "vitest"
import { createMemoryStorageAdapter } from "../adapters/memoryStorageAdapter"
import { createListenEventRepository } from "./listenEventRepository"
import type { ListenEvent } from "../domain/listening/listenEvents"
import { STORAGE } from "../config/storage"

describe("listenEventRepository", () => {
    let adapter = createMemoryStorageAdapter()

    beforeEach(() => {
        adapter = createMemoryStorageAdapter()
    })

    it("sollte leere Events laden, wenn nichts gespeichert ist", () => {
        const repository = createListenEventRepository(adapter)
        const events = repository.load()
        expect(events).toEqual([])
    })

    it("sollte Events laden, die gespeichert wurden", () => {
        const repository = createListenEventRepository(adapter)
        const testEvents: ListenEvent[] = [
            {
                id: "event-1",
                albumId: "album-1",
                listenedAt: "2024-01-01T10:00:00Z",
            },
            {
                id: "event-2",
                albumId: "album-2",
                listenedAt: "2024-01-02T15:30:00Z",
            },
        ]
        repository.save(testEvents)
        const loaded = repository.load()
        expect(loaded).toEqual(testEvents)
    })

    it("sollte ein neues Event hinzufuegen", () => {
        const repository = createListenEventRepository(adapter)
        const events: ListenEvent[] = []
        const updated = repository.add(events, "album-1")
        expect(updated).toHaveLength(1)
        expect(updated[0].albumId).toBe("album-1")
        expect(updated[0].listenedAt).toBeDefined()
    })

    it("sollte Events persistieren", () => {
        const repository = createListenEventRepository(adapter)
        const events: ListenEvent[] = []
        repository.add(events, "album-1")
        const loaded = repository.load()
        expect(loaded).toHaveLength(1)
        expect(loaded[0].albumId).toBe("album-1")
    })

    it("sollte Events loeschen", () => {
        const repository = createListenEventRepository(adapter)
        const testEvents: ListenEvent[] = [
            {
                id: "event-1",
                albumId: "album-1",
                listenedAt: "2024-01-01T10:00:00Z",
            },
        ]
        repository.save(testEvents)
        repository.clear()
        const loaded = repository.load()
        expect(loaded).toEqual([])
    })

    it("sollte defensiv bei korrupten Daten sein", () => {
        adapter.set(STORAGE.LISTEN_EVENTS, "invalid json")
        const repository = createListenEventRepository(adapter)
        const events = repository.load()
        expect(events).toEqual([])
    })
})
