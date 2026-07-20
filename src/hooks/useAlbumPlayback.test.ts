import { describe, expect, it, vi, beforeEach, afterEach } from "vitest"
import { renderHook, act, waitFor } from "@testing-library/react"
import { useAlbumPlayback } from "./useAlbumPlayback.js"
import * as playbackService from "../services/api/playbackService.js"
import { ApiError } from "../services/api/apiClient.js"

// Mock the playback service
vi.mock("../services/api/playbackService.js", async (importOriginal) => {
    const actual = await importOriginal<typeof import("../services/api/playbackService.js")>()
    return {
        ...actual,
        getPlaybackManifest: vi.fn(),
    }
})

const mockedGetPlaybackManifest = vi.mocked(playbackService.getPlaybackManifest)

// Mock Audio element
class MockAudioElement {
    src = ""
    paused = true
    currentTime = 0
    duration = 100
    preload = "none"
    private eventListeners: Map<string, Set<EventListener>> = new Map()

    play = vi.fn().mockImplementation(() => {
        this.paused = false
        return Promise.resolve()
    })

    pause = vi.fn().mockImplementation(() => {
        this.paused = true
    })

    load = vi.fn()

    addEventListener = vi.fn((event: string, handler: EventListener) => {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, new Set())
        }
        this.eventListeners.get(event)!.add(handler)
    })

    removeEventListener = vi.fn((event: string, handler: EventListener) => {
        this.eventListeners.get(event)?.delete(handler)
    })

    triggerEvent(eventName: string) {
        const listeners = this.eventListeners.get(eventName)
        if (listeners) {
            listeners.forEach((handler) => handler(new Event(eventName)))
        }
    }

    setCurrentTime(time: number) {
        this.currentTime = time
        this.triggerEvent("timeupdate")
    }

    triggerEnded() {
        this.paused = true
        this.triggerEvent("ended")
    }

    triggerError() {
        this.paused = true
        this.triggerEvent("error")
    }

    triggerLoadedMetadata() {
        this.triggerEvent("loadedmetadata")
    }
}

let mockAudioInstances: MockAudioElement[] = []

beforeEach(() => {
    mockAudioInstances = []
    // @ts-expect-error Mocking global Audio — use function constructor so `new Audio()` works
    global.Audio = function Audio() {
        const instance = new MockAudioElement()
        mockAudioInstances.push(instance)
        return instance
    } as unknown as typeof Audio
})

afterEach(() => {
    vi.clearAllMocks()
})

describe("useAlbumPlayback", () => {
    const mockManifest = {
        albumId: "album-123",
        title: "Test Album",
        artist: "Test Artist",
        coverPath: null,
        totalDuration: 300,
        tracks: [
            {
                opaqueTrackId: "track-1",
                discNumber: 1,
                trackNumber: 1,
                title: "Track One",
                duration: 100,
                mediaType: "mp3" as const,
                playable: true,
                _sourcePath: "01 Track One.mp3",
            },
            {
                opaqueTrackId: "track-2",
                discNumber: 1,
                trackNumber: 2,
                title: "Track Two",
                duration: 100,
                mediaType: "mp3" as const,
                playable: true,
                _sourcePath: "02 Track Two.mp3",
            },
            {
                opaqueTrackId: "track-3",
                discNumber: 1,
                trackNumber: 3,
                title: "Track Three",
                duration: 100,
                mediaType: "mp3" as const,
                playable: true,
                _sourcePath: "03 Track Three.mp3",
            },
        ],
        orderingDiagnostic: "ok" as const,
    }

    it("loads manifest and initializes state", async () => {
        mockedGetPlaybackManifest.mockResolvedValue(mockManifest)

        const { result } = renderHook(() => useAlbumPlayback())

        await act(async () => {
            await result.current.loadAlbum("album-123")
        })

        expect(result.current.manifest).toEqual(mockManifest)
        expect(result.current.isLoading).toBe(false)
        expect(result.current.error).toBeNull()
    })

    it("handles 404 manifest error", async () => {
        mockedGetPlaybackManifest.mockRejectedValue(
            new ApiError(404, { error: "Album or binding not found" }, "Album or binding not found")
        )

        const { result } = renderHook(() => useAlbumPlayback())

        await act(async () => {
            await result.current.loadAlbum("missing-album")
        })

        expect(result.current.manifest).toBeNull()
        expect(result.current.error).toContain("nicht gefunden")
    })

    it("handles 503 ambiguous-order error", async () => {
        mockedGetPlaybackManifest.mockRejectedValue(
            new ApiError(503, { error: "Album has ambiguous track ordering" }, "Album has ambiguous track ordering")
        )

        const { result } = renderHook(() => useAlbumPlayback())

        await act(async () => {
            await result.current.loadAlbum("ambiguous-album")
        })

        expect(result.current.manifest).toBeNull()
        expect(result.current.error).toContain("mehrdeutige")
    })

    it("play starts the first track", async () => {
        mockedGetPlaybackManifest.mockResolvedValue(mockManifest)

        const { result } = renderHook(() => useAlbumPlayback())

        await act(async () => {
            await result.current.loadAlbum("album-123")
        })

        await act(async () => {
            result.current.play()
        })

        expect(result.current.isPlaying).toBe(true)
        expect(result.current.currentTrackIndex).toBe(0)
        expect(mockAudioInstances[0].play).toHaveBeenCalled()
    })

    it("pause stops playback", async () => {
        mockedGetPlaybackManifest.mockResolvedValue(mockManifest)

        const { result } = renderHook(() => useAlbumPlayback())

        await act(async () => {
            await result.current.loadAlbum("album-123")
        })

        await act(async () => {
            result.current.play()
        })

        expect(result.current.isPlaying).toBe(true)

        await act(async () => {
            result.current.pause()
        })

        expect(result.current.isPlaying).toBe(false)
        expect(mockAudioInstances[0].pause).toHaveBeenCalled()
    })

    it("resume continues from paused state", async () => {
        mockedGetPlaybackManifest.mockResolvedValue(mockManifest)

        const { result } = renderHook(() => useAlbumPlayback())

        await act(async () => {
            await result.current.loadAlbum("album-123")
        })

        // Start playback
        await act(async () => {
            result.current.play()
        })

        // Pause
        await act(async () => {
            result.current.pause()
        })

        expect(result.current.isPlaying).toBe(false)

        // Resume — should call play() again, not restart
        await act(async () => {
            result.current.play()
        })

        expect(result.current.isPlaying).toBe(true)
        expect(mockAudioInstances[0].play).toHaveBeenCalledTimes(2)
    })

    it("transitions to next track on ended event", async () => {
        mockedGetPlaybackManifest.mockResolvedValue(mockManifest)

        const { result } = renderHook(() => useAlbumPlayback())

        await act(async () => {
            await result.current.loadAlbum("album-123")
        })

        await act(async () => {
            result.current.play()
        })

        expect(result.current.currentTrackIndex).toBe(0)

        // Simulate track end
        await act(async () => {
            mockAudioInstances[0].triggerEnded()
        })

        // Should have moved to next track
        await waitFor(() => {
            expect(result.current.currentTrackIndex).toBe(1)
            expect(result.current.isPlaying).toBe(true)
        })
    })

    it("stops after last track ends", async () => {
        mockedGetPlaybackManifest.mockResolvedValue({
            ...mockManifest,
            tracks: [mockManifest.tracks[0]],
        })

        const { result } = renderHook(() => useAlbumPlayback())

        await act(async () => {
            await result.current.loadAlbum("album-123")
        })

        await act(async () => {
            result.current.play()
        })

        expect(result.current.currentTrackIndex).toBe(0)

        // Simulate track end — this is the only track
        await act(async () => {
            mockAudioInstances[0].triggerEnded()
        })

        await waitFor(() => {
            expect(result.current.isPlaying).toBe(false)
            expect(result.current.currentTime).toBe(0)
        })
    })

    it("updates currentTime on timeupdate event", async () => {
        mockedGetPlaybackManifest.mockResolvedValue(mockManifest)

        const { result } = renderHook(() => useAlbumPlayback())

        await act(async () => {
            await result.current.loadAlbum("album-123")
        })

        await act(async () => {
            result.current.play()
        })

        await act(async () => {
            mockAudioInstances[0].setCurrentTime(42)
        })

        expect(result.current.currentTime).toBe(42)
    })

    it("sets error on audio error event", async () => {
        mockedGetPlaybackManifest.mockResolvedValue(mockManifest)

        const { result } = renderHook(() => useAlbumPlayback())

        await act(async () => {
            await result.current.loadAlbum("album-123")
        })

        await act(async () => {
            result.current.play()
        })

        expect(result.current.isPlaying).toBe(true)

        await act(async () => {
            mockAudioInstances[0].triggerError()
        })

        expect(result.current.isPlaying).toBe(false)
        expect(result.current.error).toContain("Fehler")
    })

    it("preloads next track when starting a track", async () => {
        mockedGetPlaybackManifest.mockResolvedValue(mockManifest)

        const { result } = renderHook(() => useAlbumPlayback())

        await act(async () => {
            await result.current.loadAlbum("album-123")
        })

        await act(async () => {
            result.current.play()
        })

        // Should have created a second Audio element for preload
        expect(mockAudioInstances.length).toBeGreaterThanOrEqual(2)
        expect(mockAudioInstances[1].src).toContain("track-2")
    })

    it("does not create listening events", async () => {
        // This test verifies that no persistent side effects occur
        // Playback is purely ephemeral per Sprint 89 non-goals
        mockedGetPlaybackManifest.mockResolvedValue(mockManifest)

        const { result } = renderHook(() => useAlbumPlayback())

        await act(async () => {
            await result.current.loadAlbum("album-123")
        })

        await act(async () => {
            result.current.play()
        })

        await act(async () => {
            result.current.pause()
        })

        await act(async () => {
            result.current.reset()
        })

        expect(result.current.manifest).toBeNull()
        expect(result.current.isPlaying).toBe(false)
        expect(result.current.currentTrackIndex).toBe(0)
    })
})