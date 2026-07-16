import type { DirectoryScanner } from "../infrastructure/filesystem/directoryScanner.js"
import type { BindingRepository } from "../infrastructure/persistence/sqlite/bindingRepository.js"
import type { AlbumRepository } from "../infrastructure/persistence/sqlite/albumRepository.js"
import type { ScanRunRepository } from "../infrastructure/persistence/sqlite/scanRunRepository.js"
import type { ScanOptions } from "../domain/scan/albumFolder.js"
import { suggestBindings } from "../domain/binding/albumMatcher.js"
import { rankBindingCandidates } from "../domain/binding/albumMatcher.js"
import type { BindingCandidateRepository } from "../infrastructure/persistence/sqlite/bindingCandidateRepository.js"

export interface ScanService {
    runScan(scanId: string, options?: ScanOptions): void
}

export function createScanService(
    scanner: DirectoryScanner,
    bindingRepo: BindingRepository,
    albumRepo: AlbumRepository,
    scanRunRepo: ScanRunRepository,
    candidateRepo?: BindingCandidateRepository,
): ScanService {
    return {
        runScan(scanId: string, options?: ScanOptions): void {
            const nowIso = new Date().toISOString()

            scanRunRepo.create({
                id: scanId,
                started_at: nowIso,
                finished_at: nowIso,
                directories_scanned: 0,
                directories_skipped: 0,
                album_folders_found: 0,
                status: "running",
                error_message: null,
            })

            try {
                const result = scanner(options, (progress) => {
                    scanRunRepo.updateProgress(scanId, progress.directoriesScanned, progress.directoriesSkipped)
                })
                const scannedPaths = new Set(result.albumFolders.map(f => f.relativePath))

                // 1. Mark existing confirmed bindings as missing if folder no longer found
                // Only do this if the scan actually ran (directoriesScanned > 0).
                // If the root was unreachable, directoriesScanned is 0 and we must not
                // mark everything as missing.
                if (result.directoriesScanned > 0) {
                    const confirmedBindings = bindingRepo.findByState("confirmed")
                    for (const binding of confirmedBindings) {
                        if (!scannedPaths.has(binding.relative_path)) {
                            bindingRepo.updateState(binding.album_id, "missing")
                        }
                    }
                }

                // 2. Propose all scanned folders (safe upsert — preserves confirmed)
                // albumId == normalized relativePath so Unicode forms (NFC/NFD) converge.
                for (const folder of result.albumFolders) {
                    bindingRepo.upsertProposed(folder.relativePath, folder.relativePath, nowIso)
                }

                // 3. Try to match proposed folders with library albums
                const albums = albumRepo.findAll()
                if (albums.length > 0) {
                    const candidates = result.albumFolders.map(f => ({
                        albumId: f.relativePath,
                        relativePath: f.relativePath,
                        artistName: f.artistName,
                        albumName: f.albumName,
                    }))

                    const matches = suggestBindings(
                        albums.map(a => ({ id: a.id, title: a.title, artist: a.artist })),
                        candidates,
                    )

                    for (const match of matches) {
                        // match.relativePath == binding.album_id (the path)
                        // match.libraryAlbumId == the actual library album UUID
                        bindingRepo.updateLibraryAlbumId(match.relativePath, match.libraryAlbumId)
                    }

                    if (candidateRepo) {
                        for (const folder of result.albumFolders) {
                            const binding = bindingRepo.findById(folder.relativePath)
                            if (binding?.state === "confirmed") continue
                            candidateRepo.replaceForBinding(
                                folder.relativePath,
                                scanId,
                                rankBindingCandidates(folder, albums),
                            )
                        }
                    }
                }

                scanRunRepo.updateResult(
                    scanId,
                    new Date().toISOString(),
                    result.directoriesScanned,
                    result.directoriesSkipped,
                    result.albumFolders.length,
                    "completed",
                    null,
                )
            } catch (err) {
                scanRunRepo.updateResult(
                    scanId,
                    new Date().toISOString(),
                    0,
                    0,
                    0,
                    "failed",
                    err instanceof Error ? err.message : String(err),
                )
                throw err
            }
        },
    }
}
