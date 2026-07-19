import { stat } from "node:fs/promises"
import { extname } from "node:path"
import { performance } from "node:perf_hooks"
import { parseFile, selectCover } from "music-metadata"

const SUPPORTED_EXTENSIONS = new Set([".mp3", ".m4a", ".mp4", ".flac"])
const MAX_FILES = 12
const MAX_AUDIO_BYTES = 2 * 1024 * 1024 * 1024
const MAX_COVER_BYTES = 5 * 1024 * 1024

interface ProbeResult {
    sample: number
    extension: string
    audioBytes: number
    elapsedMs: number
    rssDeltaBytes: number
    parserFormat: string | null
    pictureCount: number
    selectedPicture: { mimeType: string; bytes: number; withinBudget: boolean } | null
    outcome: "cover" | "no-cover" | "rejected" | "parse-error"
    failureCode?: "unsupported-extension" | "audio-too-large" | "invalid-media"
}

function usage(): never {
    process.stderr.write(
        "Usage: npm --prefix server run spike:artwork -- <explicit audio file> [more files]\n" +
        `Pass 1-${MAX_FILES} MP3, M4A/MP4, or FLAC files. The JSON report never includes paths or image data.\n`,
    )
    process.exit(2)
}

async function probe(filePath: string, sample: number): Promise<ProbeResult> {
    const extension = extname(filePath).toLowerCase()
    const beforeRss = process.memoryUsage().rss
    const started = performance.now()
    let audioBytes = 0

    try {
        if (!SUPPORTED_EXTENSIONS.has(extension)) {
            return finish({
                sample, extension, audioBytes, beforeRss, started,
                parserFormat: null, pictureCount: 0, selectedPicture: null,
                outcome: "rejected", failureCode: "unsupported-extension",
            })
        }

        const fileStat = await stat(filePath)
        audioBytes = fileStat.size
        if (!fileStat.isFile() || audioBytes > MAX_AUDIO_BYTES) {
            return finish({
                sample, extension, audioBytes, beforeRss, started,
                parserFormat: null, pictureCount: 0, selectedPicture: null,
                outcome: "rejected", failureCode: "audio-too-large",
            })
        }

        // duration:false avoids intentionally scanning the full audio payload. Cover data is
        // still materialized by the parser, so RSS and image-size budgets remain mandatory.
        const metadata = await parseFile(filePath, { duration: false, skipCovers: false })
        const pictures = metadata.common.picture ?? []
        const selected = selectCover(pictures)
        return finish({
            sample, extension, audioBytes, beforeRss, started,
            parserFormat: metadata.format.container ?? metadata.format.codec ?? null,
            pictureCount: pictures.length,
            selectedPicture: selected ? {
                mimeType: selected.format,
                bytes: selected.data.byteLength,
                withinBudget: selected.data.byteLength <= MAX_COVER_BYTES,
            } : null,
            outcome: selected ? "cover" : "no-cover",
        })
    } catch {
        return finish({
            sample, extension, audioBytes, beforeRss, started,
            parserFormat: null, pictureCount: 0, selectedPicture: null,
            outcome: "parse-error", failureCode: "invalid-media",
        })
    }
}

function finish(input: Omit<ProbeResult, "elapsedMs" | "rssDeltaBytes"> & {
    beforeRss: number
    started: number
}): ProbeResult {
    const { beforeRss, started, ...result } = input
    return {
        ...result,
        elapsedMs: Number((performance.now() - started).toFixed(2)),
        rssDeltaBytes: Math.max(0, process.memoryUsage().rss - beforeRss),
    }
}

const filePaths = process.argv.slice(2)
if (filePaths.length === 0 || filePaths.length > MAX_FILES) usage()

const results: ProbeResult[] = []
for (const [index, filePath] of filePaths.entries()) {
    // Deliberately sequential: bounded concurrency prevents several embedded images from
    // being materialized in memory at the same time on a small NAS.
    results.push(await probe(filePath, index + 1))
}

process.stdout.write(`${JSON.stringify({
    generatedAt: new Date().toISOString(),
    node: process.version,
    budgets: { maxFiles: MAX_FILES, maxAudioBytes: MAX_AUDIO_BYTES, maxCoverBytes: MAX_COVER_BYTES },
    results,
}, null, 2)}\n`)
