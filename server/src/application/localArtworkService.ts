import { readFile, readdir, stat } from "node:fs/promises"
import { extname, parse } from "node:path"
import { parseFile, selectCover } from "music-metadata"
import type { BindingRepository } from "../infrastructure/persistence/sqlite/bindingRepository.js"
import type { PathGuard } from "../infrastructure/filesystem/pathGuard.js"
import { MAX_COVER_SIZE_BYTES, validateImage, type ValidatedImage } from "./imageValidator.js"

const FOLDER_BASENAMES = ["cover", "folder", "front"]
const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"]
const AUDIO_EXTENSIONS = new Set([".mp3", ".m4a", ".flac"])
const MAX_AUDIO_CANDIDATES = 3
const MAX_AUDIO_BYTES = 2 * 1024 * 1024 * 1024

export type LocalArtworkSource = "folder" | "embedded"
export interface LocalArtworkResult extends ValidatedImage { source: LocalArtworkSource }

export function createLocalArtworkService(bindingRepo: BindingRepository, musicGuard: PathGuard) {
    return {
        async findForAlbum(albumId: string): Promise<LocalArtworkResult | null> {
            const binding = bindingRepo.findByLibraryAlbumId(albumId)
            if (!binding || binding.state !== "confirmed") return null
            const directory = musicGuard(binding.relative_path)
            const entries = await readdir(directory)

            const folderResult = await findFolderArtwork(entries, binding.relative_path, musicGuard)
            if (folderResult) return { ...folderResult, source: "folder" }

            const embeddedResult = await findEmbeddedArtwork(entries, binding.relative_path, musicGuard)
            return embeddedResult ? { ...embeddedResult, source: "embedded" } : null
        },
    }
}

async function findFolderArtwork(entries: string[], relativeDirectory: string, musicGuard: PathGuard) {
    const candidates = entries
        .filter(entry => FOLDER_BASENAMES.includes(parse(entry).name.toLowerCase()))
        .filter(entry => IMAGE_EXTENSIONS.includes(extname(entry).toLowerCase()))
        .sort(compareFolderCandidates)

    for (const entry of candidates) {
        try {
            const filePath = musicGuard(`${relativeDirectory}/${entry}`)
            const fileStat = await stat(filePath)
            if (!fileStat.isFile() || fileStat.size === 0 || fileStat.size > MAX_COVER_SIZE_BYTES) continue
            return await validateImage(await readFile(filePath))
        } catch {
            // Try the next deterministic candidate. Source details never leave the server.
        }
    }
    return null
}

async function findEmbeddedArtwork(entries: string[], relativeDirectory: string, musicGuard: PathGuard) {
    const candidates: Array<{ path: string; size: number; name: string }> = []
    for (const entry of entries) {
        if (!AUDIO_EXTENSIONS.has(extname(entry).toLowerCase())) continue
        try {
            const filePath = musicGuard(`${relativeDirectory}/${entry}`)
            const fileStat = await stat(filePath)
            if (fileStat.isFile() && fileStat.size <= MAX_AUDIO_BYTES) {
                candidates.push({ path: filePath, size: fileStat.size, name: entry.normalize("NFC") })
            }
        } catch {
            // Ignore unsafe or unreadable candidates.
        }
    }
    candidates.sort((a, b) => a.size - b.size || a.name.localeCompare(b.name))

    for (const candidate of candidates.slice(0, MAX_AUDIO_CANDIDATES)) {
        try {
            const metadata = await parseFile(candidate.path, { duration: false, skipCovers: false })
            const selected = selectCover(metadata.common.picture)
            if (!selected) continue
            return await validateImage(Buffer.from(selected.data), normalizeEmbeddedMime(selected.format))
        } catch {
            // Malformed tags and pictures are a bounded miss, not a scan failure.
        }
    }
    return null
}

function compareFolderCandidates(left: string, right: string): number {
    const leftName = parse(left).name.toLowerCase()
    const rightName = parse(right).name.toLowerCase()
    const basenameOrder = FOLDER_BASENAMES.indexOf(leftName) - FOLDER_BASENAMES.indexOf(rightName)
    if (basenameOrder !== 0) return basenameOrder
    const extensionOrder = extensionRank(extname(left)) - extensionRank(extname(right))
    return extensionOrder || left.normalize("NFC").localeCompare(right.normalize("NFC"))
}

function extensionRank(extension: string): number {
    const normalized = extension.toLowerCase() === ".jpeg" ? ".jpg" : extension.toLowerCase()
    return [".jpg", ".png", ".webp"].indexOf(normalized)
}

function normalizeEmbeddedMime(value: string): string {
    const normalized = value.toLowerCase()
    if (normalized === "jpg" || normalized === "jpeg" || normalized === "image/jpg") return "image/jpeg"
    if (normalized === "png") return "image/png"
    if (normalized === "webp") return "image/webp"
    return normalized
}

export type LocalArtworkService = ReturnType<typeof createLocalArtworkService>
