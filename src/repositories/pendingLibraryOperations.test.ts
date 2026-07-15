import { describe, expect, it } from "vitest"
import { createMemoryStorageAdapter } from "../adapters/memoryStorageAdapter"
import {
    completeLibraryOperation,
    enqueueLibraryOperation,
    loadPendingLibraryOperations,
} from "./pendingLibraryOperations"
import type { Album } from "../types/album"

function album(title: string): Album {
    return {
        id: "album-1",
        title,
        artist: "Artist",
        year: "2024",
        roleHistory: [],
        listenCount: 0,
        lastListened: null,
    }
}

describe("pendingLibraryOperations", () => {
    it("coalesces repeated album updates to the newest state", () => {
        const adapter = createMemoryStorageAdapter()
        enqueueLibraryOperation(adapter, { kind: "upsert", albumId: "album-1", album: album("First") })
        enqueueLibraryOperation(adapter, { kind: "upsert", albumId: "album-1", album: album("Latest") })

        const operations = loadPendingLibraryOperations(adapter)
        expect(operations).toHaveLength(1)
        expect(operations[0]).toMatchObject({ kind: "upsert", album: { title: "Latest" } })
    })

    it("lets a delete supersede a pending update for the same album", () => {
        const adapter = createMemoryStorageAdapter()
        enqueueLibraryOperation(adapter, { kind: "upsert", albumId: "album-1", album: album("Album") })
        enqueueLibraryOperation(adapter, { kind: "delete", albumId: "album-1" })

        expect(loadPendingLibraryOperations(adapter)).toMatchObject([
            { kind: "delete", albumId: "album-1" },
        ])
    })

    it("does not remove a newer operation when an older in-flight operation completes", () => {
        const adapter = createMemoryStorageAdapter()
        const inFlight = enqueueLibraryOperation(
            adapter,
            { kind: "upsert", albumId: "album-1", album: album("First") },
        )
        const newest = enqueueLibraryOperation(
            adapter,
            { kind: "upsert", albumId: "album-1", album: album("Newest") },
        )

        completeLibraryOperation(adapter, inFlight)

        expect(loadPendingLibraryOperations(adapter)).toEqual([newest])
    })

    it("coalesces cover operations separately from album operations", () => {
        const adapter = createMemoryStorageAdapter()
        enqueueLibraryOperation(adapter, { kind: "upsert", albumId: "album-1", album: album("Album") })
        enqueueLibraryOperation(adapter, { kind: "cover-upload", albumId: "album-1" })
        enqueueLibraryOperation(adapter, { kind: "cover-delete", albumId: "album-1" })

        expect(loadPendingLibraryOperations(adapter).map((operation) => operation.kind))
            .toEqual(["upsert", "cover-delete"])
    })
})
