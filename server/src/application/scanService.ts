import type { DirectoryScanner } from "../infrastructure/filesystem/directoryScanner.js"
import type { BindingRepository } from "../infrastructure/persistence/sqlite/bindingRepository.js"
import type { ScanRunRepository } from "../infrastructure/persistence/sqlite/scanRunRepository.js"
import type { ScanOptions } from "../domain/scan/albumFolder.js"

export interface ScanService {
    runScan(scanId: string, options?: ScanOptions): void
}

export function createScanService(
    scanner: DirectoryScanner,
    bindingRepo: BindingRepository,
    scanRunRepo: ScanRunRepository,
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
                const result = scanner(options)
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
