import { stat } from "node:fs/promises"
import { extname } from "node:path"
import { parseFile } from "music-metadata"
import type { BindingRepository } from "../infrastructure/persistence/sqlite/bindingRepository.js"
import type { PathGuard } from "../infrastructure/filesystem/pathGuard.js"
import { collectAudioEntries, COLLECTION_LIMITS } from "../domain/playback/audioEntryCollector.js"

const MAX_BINDINGS_INSPECTED = 25
const MAX_FILES_INSPECTED = 500
const MAX_AUDIO_BYTES = 2 * 1024 * 1024 * 1024

type PlaybackFormat = "mp3" | "m4a" | "flac"

export interface PlaybackFormatInventory {
    format: PlaybackFormat
    files: number
    parseErrors: number
    totalBytes: number
    largestFileBytes: number
    containers: string[]
    codecs: string[]
    sampleRates: number[]
    bitDepths: number[]
    trackNumberCoverage: number
    discNumberCoverage: number
    titleCoverage: number
    durationCoverage: number
    filenameFallbackRequired: number
}

export interface PlaybackInventoryReport {
    generatedAt: string
    bindingsAvailable: number
    bindingsInspected: number
    albumsWithPlayableFiles: number
    filesInspected: number
    multiDiscAlbums: number
    compilationAlbums: number
    albumsWithUnicodeNames: number
    albumsWithAmbiguousOrdering: number
    skippedOversizedFiles: number
    budgets: {
        maxBindingsInspected: number
        maxTracksPerAlbum: number
        maxFilesInspected: number
        maxAudioBytes: number
        maxDirectoryDepth: number
    }
    formats: PlaybackFormatInventory[]
}

interface MutableFormatInventory extends Omit<PlaybackFormatInventory,
    "containers" | "codecs" | "sampleRates" | "bitDepths"> {
    containers: Set<string>
    codecs: Set<string>
    sampleRates: Set<number>
    bitDepths: Set<number>
}

interface ParsedOrder {
    disc: number | null
    track: number | null
}

export function createPlaybackInventoryService(bindingRepo: BindingRepository, musicGuard: PathGuard) {
    async function run(): Promise<PlaybackInventoryReport> {
        const confirmed = bindingRepo.findByState("confirmed")
        const bindings = confirmed.slice(0, MAX_BINDINGS_INSPECTED)
        const formats = new Map<PlaybackFormat, MutableFormatInventory>(
            [".mp3", ".m4a", ".flac"].map(extension => {
                const format = extension.slice(1) as PlaybackFormat
                return [format, emptyFormat(format)]
            }),
        )

        let bindingsInspected = 0
        let albumsWithPlayableFiles = 0
        let filesInspected = 0
        let multiDiscAlbums = 0
        let compilationAlbums = 0
        let albumsWithUnicodeNames = 0
        let albumsWithAmbiguousOrdering = 0
        let skippedOversizedFiles = 0

        for (const binding of bindings) {
            if (filesInspected >= MAX_FILES_INSPECTED) break
            bindingsInspected++
            const audioEntries = await collectAudioEntries(binding.relative_path, musicGuard)
            if (audioEntries.length === 0) continue
            albumsWithPlayableFiles++
            if ([binding.relative_path, ...audioEntries.map(entry => entry.relativePath)]
                .some(name => [...name].some(character => character.codePointAt(0)! > 127))) {
                albumsWithUnicodeNames++
            }

            const orders: ParsedOrder[] = []
            let taggedCompilation = false
            for (const entry of audioEntries) {
                if (filesInspected >= MAX_FILES_INSPECTED) break
                const extension = extname(entry.name).toLowerCase() as ".mp3" | ".m4a" | ".flac"
                const aggregate = formats.get(extension.slice(1) as PlaybackFormat)!
                let filePath: string
                let fileStat
                try {
                    filePath = musicGuard(entry.relativePath)
                    fileStat = await stat(filePath)
                } catch {
                    continue
                }
                if (!fileStat.isFile()) continue
                if (fileStat.size > MAX_AUDIO_BYTES) {
                    skippedOversizedFiles++
                    continue
                }

                filesInspected++
                aggregate.files++
                aggregate.totalBytes += fileStat.size
                aggregate.largestFileBytes = Math.max(aggregate.largestFileBytes, fileStat.size)
                try {
                    const metadata = await parseFile(filePath, { duration: true, skipCovers: true })
                    const disc = positiveInteger(metadata.common.disk.no)
                    const track = positiveInteger(metadata.common.track.no)
                    orders.push({ disc, track })
                    if (track !== null) aggregate.trackNumberCoverage++
                    if (disc !== null) aggregate.discNumberCoverage++
                    if (nonBlank(metadata.common.title)) aggregate.titleCoverage++
                    if (typeof metadata.format.duration === "number" && Number.isFinite(metadata.format.duration)) {
                        aggregate.durationCoverage++
                    }
                    if (track === null) aggregate.filenameFallbackRequired++
                    addText(aggregate.containers, metadata.format.container)
                    addText(aggregate.codecs, metadata.format.codec)
                    addPositive(aggregate.sampleRates, metadata.format.sampleRate)
                    addPositive(aggregate.bitDepths, metadata.format.bitsPerSample)
                    taggedCompilation ||= metadata.common.compilation === true
                } catch {
                    aggregate.parseErrors++
                    aggregate.filenameFallbackRequired++
                    orders.push({ disc: null, track: null })
                }
            }

            const distinctDiscs = new Set(orders.map(order => order.disc).filter((disc): disc is number => disc !== null))
            if (distinctDiscs.size > 1) multiDiscAlbums++
            if (taggedCompilation) compilationAlbums++
            if (isAmbiguousOrder(orders)) albumsWithAmbiguousOrdering++
        }

        return {
            generatedAt: new Date().toISOString(),
            bindingsAvailable: confirmed.length,
            bindingsInspected,
            albumsWithPlayableFiles,
            filesInspected,
            multiDiscAlbums,
            compilationAlbums,
            albumsWithUnicodeNames,
            albumsWithAmbiguousOrdering,
            skippedOversizedFiles,
            budgets: {
                maxBindingsInspected: MAX_BINDINGS_INSPECTED,
                maxTracksPerAlbum: COLLECTION_LIMITS.MAX_TRACKS_PER_ALBUM,
                maxFilesInspected: MAX_FILES_INSPECTED,
                maxAudioBytes: MAX_AUDIO_BYTES,
                maxDirectoryDepth: COLLECTION_LIMITS.MAX_DIRECTORY_DEPTH,
            },
            formats: [...formats.values()].map(serializeFormat),
        }
    }

    return { run }
}

function emptyFormat(format: PlaybackFormat): MutableFormatInventory {
    return {
        format,
        files: 0,
        parseErrors: 0,
        totalBytes: 0,
        largestFileBytes: 0,
        containers: new Set(),
        codecs: new Set(),
        sampleRates: new Set(),
        bitDepths: new Set(),
        trackNumberCoverage: 0,
        discNumberCoverage: 0,
        titleCoverage: 0,
        durationCoverage: 0,
        filenameFallbackRequired: 0,
    }
}

function serializeFormat(format: MutableFormatInventory): PlaybackFormatInventory {
    return {
        ...format,
        containers: [...format.containers].sort(),
        codecs: [...format.codecs].sort(),
        sampleRates: [...format.sampleRates].sort((a, b) => a - b),
        bitDepths: [...format.bitDepths].sort((a, b) => a - b),
    }
}

function positiveInteger(value: unknown): number | null {
    return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : null
}

function nonBlank(value: unknown): boolean {
    return typeof value === "string" && value.trim().length > 0
}

function addText(target: Set<string>, value: unknown): void {
    if (nonBlank(value)) target.add((value as string).trim())
}

function addPositive(target: Set<number>, value: unknown): void {
    if (typeof value === "number" && Number.isFinite(value) && value > 0) target.add(value)
}

function isAmbiguousOrder(orders: ParsedOrder[]): boolean {
    if (orders.length <= 1) return false
    if (orders.some(order => order.track === null)) return true
    const keys = orders.map(order => `${order.disc ?? 1}:${order.track}`)
    return new Set(keys).size !== keys.length
}

export type PlaybackInventoryService = ReturnType<typeof createPlaybackInventoryService>