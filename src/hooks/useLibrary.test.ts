import { describe, it, expect, beforeEach, vi } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useLibrary } from "./useLibrary"
import { createMemoryStorageAdapter } from "../adapters/memoryStorageAdapter"
import { createAlbumRepository } from "../repositories/albumRepository"
import { STORAGE } from "../config/storage"
import { clearCoverCache } from "../repositories/coverCache"
import type { Album } from "../types/album"

vi.mock("../repositories/coverCache", () => ({
    saveCustomCover: vi.fn(async (_albumId: string, _blob: Blob, options?: { source?: string }) => ({
        albumId: _albumId,
        blob: _blob,
        source: options?.source,
        fetchedAt: new Date().toISOString(),
    })),
    removeCustomCover: vi.fn(async () => { }),
    clearCoverCache: vi.fn(async () => { }),
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

    it("sollte ein leeres Album-Array laden, wenn nichts gespeichert ist", () => {
        const adapter = makeAdapter()
        const { result } = renderHook(() => useLibrary(makeRepo(adapter), adapter))
        expect(result.current.albums).toEqual([])
    })

    it("sollte ein Album hinzufuegen", () => {
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
    })

    it("sollte ein Album loeschen", async () => {
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

    it("sollte ein Album aktualisieren", () => {
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

    it("sollte Cover-Cache invalidieren wenn sich coverUrl aendert", async () => {
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

    it("sollte Cover-Cache NICHT invalidieren wenn coverUrl gleich bleibt", async () => {
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

    it("sollte die Album-Rolle aktualisieren", () => {
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

    it("sollte einen Listen-Event loggen", () => {
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

    it("sollte das Fokusalbum setzen", () => {
        const adapter = makeAdapter()
        const { result } = renderHook(() => useLibrary(makeRepo(adapter), adapter))
        act(() => {
            result.current.setFocusAlbumId("album-1")
        })
        expect(result.current.focusAlbumId).toBe("album-1")
        expect(adapter.get(STORAGE.FOCUS_ALBUM)).toBe("album-1")
    })

    it("sollte legacy Daten normalisieren", () => {
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

    it("sollte ein Cover-Override setzen", async () => {
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

    it("sollte ein Cover-Override entfernen", async () => {
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
