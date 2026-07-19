import { readdir, stat } from "node:fs/promises"
import { extname } from "node:path"
import { performance } from "node:perf_hooks"
import { parseFile, selectCover } from "music-metadata"
import type { BindingRepository } from "../infrastructure/persistence/sqlite/bindingRepository.js"
import type { PathGuard } from "../infrastructure/filesystem/pathGuard.js"

const FORMATS = [".mp3", ".m4a", ".flac"] as const
const MAX_BINDINGS_INSPECTED = 100
const MAX_AUDIO_BYTES = 2 * 1024 * 1024 * 1024
const MAX_COVER_BYTES = 5 * 1024 * 1024

export interface ArtworkProbeSample {
    format: "mp3" | "m4a" | "flac"
    audioBytes: number
    elapsedMs: number
    rssDeltaBytes: number
    parserFormat: string | null
    pictureCount: number
    coverBytes: number | null
    withinCoverBudget: boolean | null
    outcome: "cover" | "no-cover" | "parse-error"
    failureCode?: "invalid-media"
}

export interface ArtworkFeasibilityReport {
    generatedAt: string
    bindingsInspected: number
    budgets: {
        maxBindingsInspected: number
        maxAudioBytes: number
        maxCoverBytes: number
    }
    missingFormats: Array<"mp3" | "m4a" | "flac">
    samples: ArtworkProbeSample[]
}

export function createArtworkFeasibilityService(bindingRepo: BindingRepository, musicGuard: PathGuard) {
    async function run(): Promise<ArtworkFeasibilityReport> {
        const bindings = bindingRepo.findByState("confirmed").slice(0, MAX_BINDINGS_INSPECTED)
        const candidates = new Map<string, string>()
        let bindingsInspected = 0

        for (const binding of bindings) {
            if (candidates.size === FORMATS.length) break
            bindingsInspected++
            let albumDirectory: string
            try {
                albumDirectory = musicGuard(binding.relative_path)
            } catch {
                continue
            }
            let entries: string[]
            try {
                entries = (await readdir(albumDirectory)).sort((a, b) => a.localeCompare(b))
            } catch {
                continue
            }
            for (const entry of entries) {
                const extension = extname(entry).toLowerCase()
                if (!FORMATS.includes(extension as typeof FORMATS[number]) || candidates.has(extension)) continue
                try {
                    const candidatePath = musicGuard(`${binding.relative_path}/${entry}`)
                    const candidateStat = await stat(candidatePath)
                    if (candidateStat.isFile() && candidateStat.size <= MAX_AUDIO_BYTES) {
                        candidates.set(extension, candidatePath)
                    }
                } catch {
                    // Ignore unreadable and unsafe candidates; never expose their paths.
                }
            }
        }

        const samples: ArtworkProbeSample[] = []
        for (const extension of FORMATS) {
            const candidate = candidates.get(extension)
            if (candidate) samples.push(await probe(candidate, extension.slice(1) as ArtworkProbeSample["format"]))
        }

        return {
            generatedAt: new Date().toISOString(),
            bindingsInspected,
            budgets: {
                maxBindingsInspected: MAX_BINDINGS_INSPECTED,
                maxAudioBytes: MAX_AUDIO_BYTES,
                maxCoverBytes: MAX_COVER_BYTES,
            },
            missingFormats: FORMATS
                .filter(extension => !candidates.has(extension))
                .map(extension => extension.slice(1) as ArtworkProbeSample["format"]),
            samples,
        }
    }

    return { run }
}

async function probe(filePath: string, format: ArtworkProbeSample["format"]): Promise<ArtworkProbeSample> {
    const fileStat = await stat(filePath)
    const beforeRss = process.memoryUsage().rss
    const started = performance.now()
    try {
        const metadata = await parseFile(filePath, { duration: false, skipCovers: false })
        const pictures = metadata.common.picture ?? []
        const selected = selectCover(pictures)
        return finish({
            format,
            audioBytes: fileStat.size,
            beforeRss,
            started,
            parserFormat: metadata.format.container ?? metadata.format.codec ?? null,
            pictureCount: pictures.length,
            coverBytes: selected?.data.byteLength ?? null,
            withinCoverBudget: selected ? selected.data.byteLength <= MAX_COVER_BYTES : null,
            outcome: selected ? "cover" : "no-cover",
        })
    } catch {
        return finish({
            format,
            audioBytes: fileStat.size,
            beforeRss,
            started,
            parserFormat: null,
            pictureCount: 0,
            coverBytes: null,
            withinCoverBudget: null,
            outcome: "parse-error",
            failureCode: "invalid-media",
        })
    }
}

function finish(input: Omit<ArtworkProbeSample, "elapsedMs" | "rssDeltaBytes"> & {
    beforeRss: number
    started: number
}): ArtworkProbeSample {
    const { beforeRss, started, ...sample } = input
    return {
        ...sample,
        elapsedMs: Number((performance.now() - started).toFixed(2)),
        rssDeltaBytes: Math.max(0, process.memoryUsage().rss - beforeRss),
    }
}

export type ArtworkFeasibilityService = ReturnType<typeof createArtworkFeasibilityService>
