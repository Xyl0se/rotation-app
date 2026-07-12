import { readdirSync, statSync } from "node:fs"
import { join, relative, sep } from "node:path"
import type { AlbumFolder, ScanOptions } from "../../domain/scan/albumFolder.js"
import { createDefaultScanOptions } from "../../domain/scan/albumFolder.js"
import type { PathGuard } from "./pathGuard.js"

export interface ScanResult {
    /** Folders that look like Artist/Album */
    albumFolders: AlbumFolder[]
    /** Total directories scanned */
    directoriesScanned: number
    /** Directories skipped (ignore list, depth exceeded) */
    directoriesSkipped: number
    /** When the scan started */
    startedAt: Date
    /** When the scan finished */
    finishedAt: Date
}

export function createDirectoryScanner(musicGuard: PathGuard) {
    return function scan(options?: ScanOptions): ScanResult {
        const opts = { ...createDefaultScanOptions(), ...options }
        const ignoreSet = opts.ignoreNames ?? new Set<string>()
        const maxDepth = opts.maxDepth ?? 3

        const albumFolders: AlbumFolder[] = []
        let directoriesScanned = 0
        let directoriesSkipped = 0
        const startedAt = new Date()

        // musicGuard resolves relative "" to the absolute music root
        const musicRoot = musicGuard("")

        function scanDir(absoluteDir: string, depth: number): void {
            if (depth > maxDepth) {
                directoriesSkipped++
                return
            }

            let entries: string[]
            try {
                entries = readdirSync(absoluteDir)
            } catch {
                directoriesSkipped++
                return
            }

            directoriesScanned++

            for (const entry of entries) {
                if (ignoreSet.has(entry)) continue

                const entryPath = join(absoluteDir, entry)
                let stat
                try {
                    stat = statSync(entryPath)
                } catch {
                    continue
                }
                if (!stat.isDirectory()) continue

                const entryDepth = depth + 1

                if (entryDepth === maxDepth - 1) {
                    // This directory is at the leaf level (e.g. Album inside Artist)
                    const parentPath = join(entryPath, "..")
                    const parentName = relative(musicRoot, parentPath)
                        .split(sep)
                        .pop() ?? ""
                    const relPath = relative(musicRoot, entryPath)

                    albumFolders.push({
                        relativePath: relPath,
                        albumName: entry,
                        artistName: parentName,
                        absolutePath: entryPath,
                    })
                } else if (entryDepth < maxDepth - 1) {
                    scanDir(entryPath, entryDepth)
                } else {
                    directoriesSkipped++
                }
            }
        }

        scanDir(musicRoot, 0)

        return {
            albumFolders,
            directoriesScanned,
            directoriesSkipped,
            startedAt,
            finishedAt: new Date(),
        }
    }
}

export type DirectoryScanner = ReturnType<typeof createDirectoryScanner>
