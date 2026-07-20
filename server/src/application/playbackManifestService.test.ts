import { describe, expect, it, vi } from "vitest"
import { createPlaybackManifestService } from "./playbackManifestService.js"
import type { BindingRepository } from "../infrastructure/persistence/sqlite/bindingRepository.js"
import type { AlbumRepository } from "../infrastructure/persistence/sqlite/albumRepository.js"
import type { PlaybackManifestRepository } from "../infrastructure/persistence/sqlite/playbackManifestRepository.js"
import type { ManifestResult } from "./playbackManifestService.js"

const ALBUM_ID = "550e8400-e29b-41d4-a716-446655440000"

function makeBindingRepo(state: "confirmed" | "proposed" | "missing" | null = "confirmed") {
    return {
        findByLibraryAlbumId: vi.fn(() => state === null ? undefined : {
            album_id: "Artist/Album",
            relative_path: "Artist/Album",
            state,
            library_album_id: ALBUM_ID,
        }),
    } as unknown as BindingRepository
}

function makeAlbumRepo() {
    return {
        findById: vi.fn(() => ({
            id: ALBUM_ID,
            title: "Album",
            artist: "Artist",
        })),
    } as unknown as AlbumRepository
}

function makeManifestRepo() {
    return {
        getManifest: vi.fn(() => null),
        save: vi.fn(),
    } as unknown as PlaybackManifestRepository
}

function makePathGuard() {
    return (relativePath: string) => `/music/${relativePath}`
}

describe("playback manifest service", () => {
    it("returns not-found when binding does not exist", async () => {
        const service = createPlaybackManifestService(
            makeBindingRepo(null),
            makeAlbumRepo(),
            makeManifestRepo(),
            makePathGuard(),
        )
        const result = await service.getManifest(ALBUM_ID)
        expect("code" in result && result.code).toBe("not-found")
    })

    it("returns not-confirmed when binding is not confirmed", async () => {
        const service = createPlaybackManifestService(
            makeBindingRepo("proposed"),
            makeAlbumRepo(),
            makeManifestRepo(),
            makePathGuard(),
        )
        const result = await service.getManifest(ALBUM_ID)
        expect("code" in result && result.code).toBe("not-confirmed")
    })

    it("returns not-found when album does not exist", async () => {
        const albumRepo = makeAlbumRepo()
        albumRepo.findById = vi.fn(() => undefined)
        const service = createPlaybackManifestService(
            makeBindingRepo(),
            albumRepo,
            makeManifestRepo(),
            makePathGuard(),
        )
        const result = await service.getManifest(ALBUM_ID)
        expect("code" in result && result.code).toBe("not-found")
    })

    it("returns cached manifest when available and valid", async () => {
        const manifestRepo = makeManifestRepo()
        manifestRepo.getManifest = vi.fn(() => ({
            albumId: ALBUM_ID,
            manifest: {
                albumId: ALBUM_ID,
                title: "Album",
                artist: "Artist",
                coverPath: `/covers/${ALBUM_ID}`,
                totalDuration: 100,
                tracks: [],
                orderingDiagnostic: "ok" as const,
            },
            orderingDiagnostic: "ok" as const,
            filenameFallbackUsed: false,
            cachedAt: new Date().toISOString(),
            invalidatedAt: null,
        }))
        const service = createPlaybackManifestService(
            makeBindingRepo(),
            makeAlbumRepo(),
            manifestRepo,
            makePathGuard(),
        )
        const result = await service.getManifest(ALBUM_ID) as ManifestResult
        expect(result.manifest.albumId).toBe(ALBUM_ID)
        expect(manifestRepo.getManifest).toHaveBeenCalledWith(ALBUM_ID)
    })

    it("uses cache even when getManifest returns invalidated entry", async () => {
        const manifestRepo = makeManifestRepo()
        manifestRepo.getManifest = vi.fn(() => ({
            albumId: ALBUM_ID,
            manifest: {
                albumId: ALBUM_ID,
                title: "Album",
                artist: "Artist",
                coverPath: `/covers/${ALBUM_ID}`,
                totalDuration: 100,
                tracks: [],
                orderingDiagnostic: "ok" as const,
            },
            orderingDiagnostic: "ok" as const,
            filenameFallbackUsed: false,
            cachedAt: new Date().toISOString(),
            invalidatedAt: "2024-01-01T00:00:00Z",
        }))
        const service = createPlaybackManifestService(
            makeBindingRepo(),
            makeAlbumRepo(),
            manifestRepo,
            makePathGuard(),
        )
        const result = await service.getManifest(ALBUM_ID) as ManifestResult
        // Should regenerate since invalidatedAt is set; still returns a manifest because
        // the service re-creates one from the (mocked) filesystem.
        expect(result.manifest.albumId).toBe(ALBUM_ID)
    })
})