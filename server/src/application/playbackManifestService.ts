import { createHash } from "node:crypto"
import { stat } from "node:fs/promises"
import { parse } from "node:path"
import { parseFile } from "music-metadata"
import type { AlbumRepository } from "../infrastructure/persistence/sqlite/albumRepository.js"
import type { BindingRepository } from "../infrastructure/persistence/sqlite/bindingRepository.js"
import type { PathGuard } from "../infrastructure/filesystem/pathGuard.js"
import type { PlaybackManifestRepository } from "../infrastructure/persistence/sqlite/playbackManifestRepository.js"
import {
    collectAudioEntries,
    parseMediaType,
    type AudioEntry,
} from "../domain/playback/audioEntryCollector.js"
import type {
    OrderingDiagnostic,
    PlaybackManifest,
    PlaybackTrack,
} from "../domain/playback/playbackManifest.js"

const MAX_AUDIO_BYTES = 2 * 1024 * 1024 * 1024

export interface ManifestResult {
    manifest: PlaybackManifest
    orderingDiagnostic: OrderingDiagnostic
    filenameFallbackUsed: boolean
}

export interface ManifestError {
    code: "not-found" | "not-confirmed" | "ambiguous-order"
    diagnostic?: OrderingDiagnostic
}

export function createPlaybackManifestService(
    bindingRepo: BindingRepository,
    albumRepo: AlbumRepository,
    manifestRepo: PlaybackManifestRepository,
    musicGuard: PathGuard,
) {
    async function getManifest(albumId: string): Promise<ManifestResult | ManifestError> {
        // 1. Validate binding
        const binding = bindingRepo.findByLibraryAlbumId(albumId)
        if (!binding) return { code: "not-found" }
        if (binding.state !== "confirmed") return { code: "not-confirmed" }

        // 2. Check cache
        const cached = manifestRepo.getManifest(albumId)
        if (cached && cached.invalidatedAt === null) {
            return {
                manifest: cached.manifest,
                orderingDiagnostic: cached.orderingDiagnostic,
                filenameFallbackUsed: cached.filenameFallbackUsed,
            }
        }

        // 3. Load album metadata
        const album = albumRepo.findById(albumId)
        if (!album) return { code: "not-found" }

        // 4. Collect audio entries
        const audioEntries = await collectAudioEntries(binding.relative_path, musicGuard)
        if (audioEntries.length === 0) {
            return {
                manifest: buildEmptyManifest(albumId, album.title, album.artist),
                orderingDiagnostic: "ok",
                filenameFallbackUsed: false,
            }
        }

        // 5. Parse metadata for each track
        const parsedTracks: Array<{
            entry: AudioEntry
            disc: number | null
            track: number | null
            title: string
            duration: number | null
            mediaType: "mp3" | "m4a" | "flac" | null
            titleFromFallback: boolean
            trackFromFallback: boolean
        }> = []
        for (const entry of audioEntries) {
            const filePath = musicGuard(entry.relativePath)
            const fileStat = await stat(filePath).catch(() => null)
            if (!fileStat?.isFile()) continue
            if (fileStat.size > MAX_AUDIO_BYTES) continue

            let metadata
            try {
                metadata = await parseFile(filePath, { duration: true, skipCovers: true })
            } catch {
                metadata = null
            }

            const disc = positiveInteger(metadata?.common.disk.no ?? null)
            const track = positiveInteger(metadata?.common.track.no ?? null)
            const title = nonBlank(metadata?.common.title)
                ? (metadata!.common.title as string).trim()
                : parse(entry.name).name
            const duration = typeof metadata?.format.duration === "number" && Number.isFinite(metadata.format.duration)
                ? metadata.format.duration
                : null
            const mediaType = parseMediaType(entry.name)

            parsedTracks.push({
                entry,
                disc,
                track,
                title,
                duration,
                mediaType,
                titleFromFallback: !nonBlank(metadata?.common.title),
                trackFromFallback: track === null,
            })
        }

        // 6. Determine ordering and diagnostic
        const ordering = determineOrdering(parsedTracks)
        if (ordering.code === "ambiguous") {
            return { code: "ambiguous-order", diagnostic: ordering.diagnostic }
        }

        // 7. Sort tracks
        const sorted = sortTracks(parsedTracks, ordering.mode)

        // 8. Build manifest
        const tracks: PlaybackTrack[] = sorted.map((pt, index) => ({
            opaqueTrackId: deriveOpaqueTrackId(albumId, pt.entry.relativePath, index),
            discNumber: pt.disc,
            trackNumber: pt.track,
            title: pt.title,
            duration: pt.duration,
            mediaType: pt.mediaType!,
            playable: pt.mediaType !== null,
        }))

        const totalDuration = tracks.every(t => t.duration !== null)
            ? tracks.reduce((sum, t) => sum + (t.duration ?? 0), 0)
            : null

        const filenameFallbackUsed = parsedTracks.some(pt => pt.titleFromFallback || pt.trackFromFallback)
        const diagnostic: OrderingDiagnostic = ordering.diagnostic

        const manifest: PlaybackManifest = {
            albumId,
            title: album.title,
            artist: album.artist,
            coverPath: `/covers/${albumId}`,
            totalDuration,
            tracks,
            orderingDiagnostic: diagnostic,
        }

        // 9. Cache
        manifestRepo.save(albumId, manifest, diagnostic, filenameFallbackUsed, new Date().toISOString())

        return { manifest, orderingDiagnostic: diagnostic, filenameFallbackUsed }
    }

    return { getManifest }
}

function buildEmptyManifest(albumId: string, title: string, artist: string): PlaybackManifest {
    return {
        albumId,
        title,
        artist,
        coverPath: `/covers/${albumId}`,
        totalDuration: null,
        tracks: [],
        orderingDiagnostic: "ok",
    }
}

type OrderingMode = "disc-track" | "filename"

interface OrderingResult {
    code: "ok" | "ambiguous"
    mode: OrderingMode
    diagnostic: OrderingDiagnostic
}

function determineOrdering(
    tracks: Array<{ disc: number | null; track: number | null; trackFromFallback: boolean }>,
): OrderingResult {
    if (tracks.length <= 1) {
        return { code: "ok", mode: "disc-track", diagnostic: "ok" }
    }

    // Check for duplicates in (disc, track) pairs
    const keys = tracks.map(t => `${t.disc ?? 1}:${t.track ?? 0}`)
    if (new Set(keys).size !== keys.length && tracks.every(t => t.track !== null)) {
        return { code: "ambiguous", mode: "disc-track", diagnostic: "duplicate-positions" }
    }

    // If any track number is missing, fall back to filename ordering
    if (tracks.some(t => t.trackFromFallback)) {
        return { code: "ok", mode: "filename", diagnostic: "filename-fallback-used" }
    }

    // All track numbers present; check if any disc numbers are missing
    if (tracks.some(t => t.disc === null)) {
        return { code: "ok", mode: "disc-track", diagnostic: "missing-disc-numbers" }
    }

    return { code: "ok", mode: "disc-track", diagnostic: "ok" }
}

function sortTracks<T extends { entry: AudioEntry; disc: number | null; track: number | null }>(
    tracks: T[],
    mode: OrderingMode,
): T[] {
    const sorted = [...tracks]
    if (mode === "filename") {
        sorted.sort((a, b) => a.entry.name.localeCompare(b.entry.name, undefined, { numeric: true }))
    } else {
        sorted.sort((a, b) => {
            const discA = a.disc ?? 1
            const discB = b.disc ?? 1
            if (discA !== discB) return discA - discB
            const trackA = a.track ?? Number.POSITIVE_INFINITY
            const trackB = b.track ?? Number.POSITIVE_INFINITY
            return trackA - trackB
        })
    }
    return sorted
}

function deriveOpaqueTrackId(albumId: string, relativePath: string, sortIndex: number): string {
    return createHash("sha256")
        .update(`${albumId}:${relativePath}:${sortIndex}`)
        .digest("hex")
        .slice(0, 32)
}

function positiveInteger(value: unknown): number | null {
    return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : null
}

function nonBlank(value: unknown): boolean {
    return typeof value === "string" && value.trim().length > 0
}

export type PlaybackManifestService = ReturnType<typeof createPlaybackManifestService>