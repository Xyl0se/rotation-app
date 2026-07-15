import { describe, it, expect, beforeEach, vi } from "vitest"
import { renderHook, act, waitFor } from "@testing-library/react"
import { useLibrary } from "./useLibrary"
import { createMemoryStorageAdapter } from "../adapters/memoryStorageAdapter"
import { createAlbumRepository } from "../repositories/albumRepository"
import { STORAGE } from "../config/storage"
import { clearCoverCache } from "../repositories/coverCache"
import type { Album } from "../types/album"
import {
    fetchAlbums,
    importAlbums,
} from "../services/api/albumsService"
import { getCustomCover } from "../repositories/coverCache"
import { uploadCover } from "../services/api/coversService"

vi.mock("../repositories/coverCache", () => ({
    saveCustomCover: vi.fn(async (_albumId: string, _blob: Blob, options?: { source?: string }) => ({
        albumId: _albumId,
        blob: _blob,
        source: options?.source,
        fetchedAt: new Date().toISOString(),
    })),
    removeCustomCover: vi.fn(async () => { }),
    getCustomCover: vi.fn(async () => null),
    clearCoverCache: vi.fn(async () => { }),
    resolveCoverUrl: vi.fn(async () => null),
}))

vi.mock("../services/api/albumsService", () => ({
    fetchAlbums: vi.fn(async () => []),
    importAlbums: vi.fn(async () => ({ imported: 0, updated: 0, failed: 0 })),
    createAlbum: vi.fn(async (album: Album) => album),
    updateAlbum: vi.fn(async (album: Album) => album),
    deleteAlbum: vi.fn(async () => { }),
}))

vi.mock("../services/api/coversService", () => ({
    uploadCover: vi.fn(async () => { }),
    deleteCover: vi.fn(async () => { }),
    fetchCoverUrl: vi.fn(async () => null),
}))

describe("useLibrary", () => {
    function makeAdapter() {
        return createMemoryStorageAdapter()
    }

    function makeRepo(adapter = makeAdapter()) {
        return createAlbumRepository(adapter)
    }

    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("should load an empty album array when nothing is stored", () => {
        const adapter = makeAdapter()
        const { result } = renderHook(() => useLibrary(makeRepo(adapter), adapter))
        expect(result.current.albums).toEqual([])
    })

    it("loads the authoritative Library from the server and refreshes the cache", async () => {
        const adapter = makeAdapter()
        const cached = makeAlbum("cached", "Cached")
        const serverAlbum = makeAlbum("server", "Server")
        adapter.set(STORAGE.LIBRARY, JSON.stringify([cached]))
        vi.mocked(fetchAlbums).mockResolvedValueOnce([serverAlbum])

        const { result } = renderHook(() => useLibrary(makeRepo(adapter), adapter, true))

        await waitFor(() => expect(result.current.isLoading).toBe(false))
        expect(result.current.albums).toEqual([serverAlbum])
        expect(result.current.persistenceMode).toBe("server")
        expect(result.current.syncError).toBeNull()
        expect(JSON.parse(adapter.get(STORAGE.LIBRARY) ?? "[]")).toEqual([serverAlbum])
    })

    it("keeps the last-known-good cache when the server is unavailable", async () => {
        const adapter = makeAdapter()
        const cached = makeAlbum("cached", "Cached")
        adapter.set(STORAGE.LIBRARY, JSON.stringify([cached]))
        vi.mocked(fetchAlbums).mockRejectedValueOnce(new Error("API unavailable"))

        const { result } = renderHook(() => useLibrary(makeRepo(adapter), adapter, true))

        await waitFor(() => expect(result.current.isLoading).toBe(false))
        expect(result.current.albums).toEqual([cached])
        expect(result.current.persistenceMode).toBe("cache")
        expect(result.current.syncError).toBe("API unavailable")
    })

    it("imports a legacy cache into an empty server once and verifies it", async () => {
        const adapter = makeAdapter()
        const cached = makeAlbum("cached", "Cached")
        adapter.set(STORAGE.LIBRARY, JSON.stringify([cached]))
        vi.mocked(fetchAlbums)
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce([cached])

        const { result } = renderHook(() => useLibrary(makeRepo(adapter), adapter, true))

        await waitFor(() => expect(result.current.isLoading).toBe(false))
        expect(importAlbums).toHaveBeenCalledOnce()
        expect(importAlbums).toHaveBeenCalledWith([cached])
        expect(result.current.albums).toEqual([cached])
        expect(adapter.get(STORAGE.LIBRARY_SERVER_MIGRATION)).toBe("complete")
    })

    it("does not overwrite a migrated cache when the server unexpectedly becomes empty", async () => {
        const adapter = makeAdapter()
        const cached = makeAlbum("cached", "Cached")
        adapter.set(STORAGE.LIBRARY, JSON.stringify([cached]))
        adapter.set(STORAGE.LIBRARY_SERVER_MIGRATION, "complete")
        vi.mocked(fetchAlbums).mockResolvedValueOnce([])

        const { result } = renderHook(() => useLibrary(makeRepo(adapter), adapter, true))

        await waitFor(() => expect(result.current.isLoading).toBe(false))
        expect(result.current.albums).toEqual([cached])
        expect(result.current.persistenceMode).toBe("cache")
        expect(result.current.syncError).toContain("empty after a completed migration")
        expect(importAlbums).not.toHaveBeenCalled()
    })

    it("keeps the cache when migration read-back contains different album IDs", async () => {
        const adapter = makeAdapter()
        const cached = makeAlbum("cached", "Cached")
        adapter.set(STORAGE.LIBRARY, JSON.stringify([cached]))
        vi.mocked(fetchAlbums)
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce([makeAlbum("different", "Different")])

        const { result } = renderHook(() => useLibrary(makeRepo(adapter), adapter, true))

        await waitFor(() => expect(result.current.isLoading).toBe(false))
        expect(result.current.albums).toEqual([cached])
        expect(result.current.persistenceMode).toBe("cache")
        expect(result.current.syncError).toBe("Server migration verification failed")
        expect(adapter.get(STORAGE.LIBRARY_SERVER_MIGRATION)).toBeNull()
    })

    it("should add an album", () => {
        const adapter = makeAdapter()
        const { result } = renderHook(() => useLibrary(makeRepo(adapter), adapter))
        const album: Album = {
            id: "test-1",
            title: "Test Album",
            artist: "Test Artist",
            year: "2024",
            roleHistory: [],
            listenCount: 0,
            lastListened: null,
        }
        act(() => {
            result.current.addAlbum(album)
        })
        expect(result.current.albums).toHaveLength(1)
        expect(result.current.albums[0].title).toBe("Test Album")
        expect(result.current.pendingOperationCount).toBe(1)
    })

    it("replays an offline album change when connectivity returns", async () => {
        const adapter = makeAdapter()
        const queuedAlbum = makeAlbum("queued", "Queued")
        vi.mocked(fetchAlbums).mockResolvedValueOnce([queuedAlbum])
        const { result, rerender } = renderHook(
            ({ connected }) => useLibrary(makeRepo(adapter), adapter, connected),
            { initialProps: { connected: false } },
        )

        act(() => result.current.addAlbum(queuedAlbum))
        expect(result.current.pendingOperationCount).toBe(1)

        rerender({ connected: true })

        await waitFor(() => expect(result.current.pendingOperationCount).toBe(0))
        expect(importAlbums).toHaveBeenCalledWith([queuedAlbum])
        expect(result.current.lastSuccessfulSyncAt).not.toBeNull()
        expect(result.current.syncError).toBeNull()
    })

    it("keeps a failed online mutation queued and exposes the error", async () => {
        const adapter = makeAdapter()
        const serverAlbum = makeAlbum("server", "Server")
        vi.mocked(fetchAlbums).mockResolvedValueOnce([serverAlbum])
        vi.mocked(importAlbums).mockRejectedValueOnce(new Error("Write failed"))
        const { result } = renderHook(() => useLibrary(makeRepo(adapter), adapter, true))
        await waitFor(() => expect(result.current.isLoading).toBe(false))

        act(() => result.current.updateAlbum({ ...serverAlbum, title: "Updated" }))

        await waitFor(() => expect(result.current.syncError).toBe("Write failed"))
        expect(result.current.albums[0].title).toBe("Updated")
        expect(result.current.pendingOperationCount).toBe(1)
    })

    it("replays pending cover binary data from IndexedDB on reconnect", async () => {
        const adapter = makeAdapter()
        const queuedAlbum = makeAlbum("cover-album", "Cover Album")
        const blob = new Blob([new Uint8Array([137, 80, 78, 71])], { type: "image/png" })
        vi.mocked(getCustomCover).mockResolvedValueOnce({
            blob,
            blobUrl: "blob:test",
            source: "upload",
        })
        vi.mocked(fetchAlbums).mockResolvedValueOnce([queuedAlbum])
        const { result, rerender } = renderHook(
            ({ connected }) => useLibrary(makeRepo(adapter), adapter, connected),
            { initialProps: { connected: false } },
        )
        act(() => result.current.addAlbum(queuedAlbum))
        await act(async () => {
            await result.current.updateAlbumCoverOverride("cover-album", blob, "upload")
        })

        rerender({ connected: true })

        await waitFor(() => expect(result.current.pendingOperationCount).toBe(0))
        expect(uploadCover).toHaveBeenCalledWith(
            "cover-album",
            expect.any(ArrayBuffer),
            "image/png",
        )
    })

    it("should delete an album", async () => {
        const adapter = makeAdapter()
        const { result } = renderHook(() => useLibrary(makeRepo(adapter), adapter))
        const album: Album = {
            id: "test-1",
            title: "Test Album",
            artist: "Test Artist",
            year: "2024",
            roleHistory: [],
            listenCount: 0,
            lastListened: null,
        }
        act(() => {
            result.current.addAlbum(album)
        })
        await act(async () => {
            await result.current.deleteAlbum("test-1")
        })
        expect(result.current.albums).toHaveLength(0)
    })

    it("should update an album", () => {
        const adapter = makeAdapter()
        const { result } = renderHook(() => useLibrary(makeRepo(adapter), adapter))
        const album: Album = {
            id: "test-1",
            title: "Test Album",
            artist: "Test Artist",
            year: "2024",
            roleHistory: [],
            listenCount: 0,
            lastListened: null,
        }
        act(() => {
            result.current.addAlbum(album)
        })
        act(() => {
            result.current.updateAlbum({
                ...album,
                title: "Updated Title",
            })
        })
        expect(result.current.albums[0].title).toBe("Updated Title")
    })

    it("should invalidate cover cache when coverUrl changes", async () => {
        const adapter = makeAdapter()
        const { result } = renderHook(() => useLibrary(makeRepo(adapter), adapter))
        const album: Album = {
            id: "test-1",
            title: "Test Album",
            artist: "Test Artist",
            year: "2024",
            coverUrl: "https://example.com/old.jpg",
            roleHistory: [],
            listenCount: 0,
            lastListened: null,
        }
        act(() => {
            result.current.addAlbum(album)
        })
        await act(async () => {
            result.current.updateAlbum({
                ...album,
                coverUrl: "https://example.com/new.jpg",
            })
        })
        expect(clearCoverCache).toHaveBeenCalledWith("test-1")
    })

    it("should NOT invalidate cover cache when coverUrl stays the same", async () => {
        const adapter = makeAdapter()
        const { result } = renderHook(() => useLibrary(makeRepo(adapter), adapter))
        const album: Album = {
            id: "test-1",
            title: "Test Album",
            artist: "Test Artist",
            year: "2024",
            coverUrl: "https://example.com/cover.jpg",
            roleHistory: [],
            listenCount: 0,
            lastListened: null,
        }
        act(() => {
            result.current.addAlbum(album)
        })
        vi.clearAllMocks()
        await act(async () => {
            result.current.updateAlbum({
                ...album,
                title: "New Title",
            })
        })
        expect(clearCoverCache).not.toHaveBeenCalled()
    })

    it("should update the album role", () => {
        const adapter = makeAdapter()
        const { result } = renderHook(() => useLibrary(makeRepo(adapter), adapter))
        const album: Album = {
            id: "test-1",
            title: "Test Album",
            artist: "Test Artist",
            year: "2024",
            roleHistory: [],
            listenCount: 0,
            lastListened: null,
        }
        act(() => {
            result.current.addAlbum(album)
        })
        act(() => {
            result.current.updateAlbumRole("test-1", "comfort-food", "reflection")
        })
        expect(result.current.albums[0].category).toBe("comfort-food")
        expect(result.current.albums[0].roleHistory).toHaveLength(1)
    })

    it("should log a listen event", () => {
        const adapter = makeAdapter()
        const { result } = renderHook(() => useLibrary(makeRepo(adapter), adapter))
        const album: Album = {
            id: "test-1",
            title: "Test Album",
            artist: "Test Artist",
            year: "2024",
            roleHistory: [],
            listenCount: 0,
            lastListened: null,
        }
        act(() => {
            result.current.addAlbum(album)
        })
        act(() => {
            result.current.logListenForAlbum("test-1")
        })
        expect(result.current.albums[0].listenCount).toBe(1)
        expect(result.current.albums[0].lastListened).not.toBeNull()
    })

    it("should set the focus album", () => {
        const adapter = makeAdapter()
        const { result } = renderHook(() => useLibrary(makeRepo(adapter), adapter))
        act(() => {
            result.current.setFocusAlbumId("album-1")
        })
        expect(result.current.focusAlbumId).toBe("album-1")
        expect(adapter.get(STORAGE.FOCUS_ALBUM)).toBe("album-1")
    })

    it("should normalize legacy data", () => {
        const adapter = makeAdapter()
        const legacyAlbum = {
            id: "legacy-1",
            title: "Legacy Album",
            artist: "Legacy Artist",
            year: "2023",
        }
        adapter.set(STORAGE.LIBRARY, JSON.stringify([legacyAlbum]))
        const { result } = renderHook(() => useLibrary(makeRepo(adapter), adapter))
        expect(result.current.albums[0].roleHistory).toEqual([])
        expect(result.current.albums[0].listenCount).toBe(0)
        expect(result.current.albums[0].lastListened).toBeNull()
    })

    it("should set a cover override", async () => {
        const adapter = makeAdapter()
        const { result } = renderHook(() => useLibrary(makeRepo(adapter), adapter))
        const album: Album = {
            id: "test-1",
            title: "Test Album",
            artist: "Test Artist",
            year: "2024",
            roleHistory: [],
            listenCount: 0,
            lastListened: null,
        }
        act(() => {
            result.current.addAlbum(album)
        })
        const blob = new Blob(["test"], { type: "image/png" })
        await act(async () => {
            await result.current.updateAlbumCoverOverride("test-1", blob, "upload")
        })
        const updated = result.current.albums[0]
        expect(updated.coverOverride).toBeDefined()
        expect(updated.coverOverride?.type).toBe("custom")
        if (updated.coverOverride?.type === "custom") {
            expect(updated.coverOverride.source).toBe("upload")
        }
        expect(updated.coverOverride?.albumId).toBe("test-1")
    })

    it("should remove a cover override", async () => {
        const adapter = makeAdapter()
        const { result } = renderHook(() => useLibrary(makeRepo(adapter), adapter))
        const album: Album = {
            id: "test-1",
            title: "Test Album",
            artist: "Test Artist",
            year: "2024",
            roleHistory: [],
            listenCount: 0,
            lastListened: null,
        }
        act(() => {
            result.current.addAlbum(album)
        })
        const blob = new Blob(["test"], { type: "image/png" })
        await act(async () => {
            await result.current.updateAlbumCoverOverride("test-1", blob, "upload")
        })
        await act(async () => {
            await result.current.removeAlbumCoverOverride("test-1")
        })
        expect(result.current.albums[0].coverOverride).toBeUndefined()
    })
})

function makeAlbum(id: string, title: string): Album {
    return {
        id,
        title,
        artist: "Artist",
        year: "2024",
        roleHistory: [],
        listenCount: 0,
        lastListened: null,
    }
}
