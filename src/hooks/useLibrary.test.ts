import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { Album } from "../types/album"
import { createAlbum, fetchAlbums, updateAlbum } from "../services/api/albumsService"
import { useLibrary } from "./useLibrary"

vi.mock("../services/api/albumsService", () => ({
    fetchAlbums: vi.fn(async () => []),
    createAlbum: vi.fn(async (album: Album) => album),
    updateAlbum: vi.fn(async (album: Album) => album),
    deleteAlbum: vi.fn(async () => undefined),
}))

vi.mock("../services/api/coversService", () => ({
    uploadCover: vi.fn(async () => undefined),
    deleteCover: vi.fn(async () => undefined),
}))

vi.mock("../repositories/coverCache", () => ({
    saveCustomCover: vi.fn(async () => ({ fetchedAt: "2026-07-15T00:00:00.000Z" })),
    removeCustomCover: vi.fn(async () => undefined),
    clearCoverCache: vi.fn(async () => undefined),
}))

function album(id = "762afc5e-5408-4d9d-b48a-237874d7ec34", title = "Album"): Album {
    return {
        id,
        title,
        artist: "Artist",
        year: "2026",
        roleHistory: [],
        listenCount: 0,
        lastListened: null,
    }
}

describe("useLibrary server ownership", () => {
    beforeEach(() => vi.clearAllMocks())

    it("loads only the authoritative server Library", async () => {
        vi.mocked(fetchAlbums).mockResolvedValueOnce([album()])

        const { result } = renderHook(() => useLibrary(true))

        await waitFor(() => expect(result.current.isLoading).toBe(false))
        expect(result.current.albums).toEqual([album()])
    })

    it("adds an Album only after the server confirms it", async () => {
        const created = album()
        let resolveCreate!: (value: Album) => void
        vi.mocked(createAlbum).mockReturnValueOnce(new Promise(resolve => {
            resolveCreate = resolve
        }))
        const { result } = renderHook(() => useLibrary(true))
        await waitFor(() => expect(result.current.isLoading).toBe(false))

        let mutation!: Promise<boolean>
        act(() => {
            mutation = result.current.addAlbum(created)
        })
        expect(result.current.albums).toEqual([])

        await act(async () => {
            resolveCreate(created)
            expect(await mutation).toBe(true)
        })
        expect(result.current.albums).toEqual([created])
        expect(createAlbum).toHaveBeenCalledWith(created, [])
    })

    it("keeps confirmed state unchanged when a server mutation fails", async () => {
        const original = album()
        vi.mocked(fetchAlbums).mockResolvedValueOnce([original])
        vi.mocked(updateAlbum).mockRejectedValueOnce(new Error("Write failed"))
        const { result } = renderHook(() => useLibrary(true))
        await waitFor(() => expect(result.current.albums).toEqual([original]))

        await act(async () => {
            expect(await result.current.updateAlbum({ ...original, title: "Changed" })).toBe(false)
        })

        expect(result.current.albums).toEqual([original])
        expect(result.current.libraryError).toBe("Write failed")
    })
})
