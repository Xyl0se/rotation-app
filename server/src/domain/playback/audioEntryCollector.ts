import { readdir } from "node:fs/promises"
import { extname } from "node:path"
import type { PathGuard } from "../../infrastructure/filesystem/pathGuard.js"

export const SUPPORTED_EXTENSIONS = [".mp3", ".m4a", ".flac"] as const

export const COLLECTION_LIMITS = {
    MAX_TRACKS_PER_ALBUM: 100,
    MAX_DIRECTORY_DEPTH: 2,
} as const

export interface AudioEntry {
    name: string
    relativePath: string
}

export async function collectAudioEntries(
    bindingPath: string,
    musicGuard: PathGuard,
): Promise<AudioEntry[]> {
    const result: AudioEntry[] = []
    const pending = [{ relativePath: bindingPath, depth: 0 }]

    while (pending.length > 0 && result.length < COLLECTION_LIMITS.MAX_TRACKS_PER_ALBUM) {
        const directory = pending.shift()!
        let entries
        try {
            entries = (await readdir(musicGuard(directory.relativePath), { withFileTypes: true }))
                .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
        } catch {
            continue
        }
        for (const entry of entries) {
            if (entry.isSymbolicLink()) continue
            const relativePath = `${directory.relativePath}/${entry.name}`
            if (entry.isDirectory() && directory.depth < COLLECTION_LIMITS.MAX_DIRECTORY_DEPTH) {
                pending.push({ relativePath, depth: directory.depth + 1 })
                continue
            }
            if (!entry.isFile()) continue
            const extension = extname(entry.name).toLowerCase()
            if (!SUPPORTED_EXTENSIONS.includes(extension as typeof SUPPORTED_EXTENSIONS[number])) continue
            result.push({ name: entry.name, relativePath })
            if (result.length >= COLLECTION_LIMITS.MAX_TRACKS_PER_ALBUM) break
        }
    }
    return result
}

export function parseMediaType(filename: string): "mp3" | "m4a" | "flac" | null {
    const ext = extname(filename).toLowerCase()
    if (ext === ".mp3") return "mp3"
    if (ext === ".m4a") return "m4a"
    if (ext === ".flac") return "flac"
    return null
}