import { randomUUID } from "node:crypto"
import { createLogger } from "../infrastructure/logger/logger.js"
import type { BindingRepository } from "../infrastructure/persistence/sqlite/bindingRepository.js"
import type { ExportOperationRepository } from "../infrastructure/persistence/sqlite/exportOperationRepository.js"
import type { ExportLockRepository } from "../infrastructure/persistence/sqlite/exportLockRepository.js"
import type { PathGuard } from "../infrastructure/filesystem/pathGuard.js"
import {
    previewExport,
    stageExportAsync,
    applyExport,
    rollbackStaging,
    type ExportPreviewResult,
    type ExportApplyResult,
} from "../domain/export/exportEngine.js"
import type { ExportDiff } from "../domain/export/exportDiff.js"

const log = createLogger("automated-export-service")

export interface AutomatedExportService {
    runHeadlessExport(albumIds: string[]): Promise<ExportApplyResult & { diff: ExportDiff }>
}

function mapBindingsByLibraryAlbumId(
    bindings: ReturnType<BindingRepository["findAll"]>,
): Map<string, ReturnType<BindingRepository["findAll"]>[number]> {
    return new Map(
        bindings
            .filter((binding) => binding.library_album_id !== null)
            .map((binding) => [binding.library_album_id!, binding]),
    )
}

export function createAutomatedExportService(
    bindingRepo: BindingRepository,
    exportRepo: ExportOperationRepository,
    lockRepo: ExportLockRepository,
    musicGuard: PathGuard,
    workspaceGuard: PathGuard,
): AutomatedExportService {
    return {
        async runHeadlessExport(albumIds: string[]): Promise<ExportApplyResult & { diff: ExportDiff }> {
            const exportId = randomUUID()

            // 1. Acquire lock
            if (!lockRepo.acquire(exportId)) {
                const current = lockRepo.getCurrent()
                throw new Error(
                    `Export is currently locked by another operation: ${current?.export_id ?? "unknown"}`
                )
            }

            let preview: ExportPreviewResult | null = null

            try {
                // 2. Create preview internally
                const allBindings = bindingRepo.findAll()
                const bindingMap = mapBindingsByLibraryAlbumId(allBindings)
                preview = previewExport(exportId, albumIds, bindingMap, musicGuard)

                if (!preview.canExport) {
                    throw new Error("EXPORT_NOT_READY")
                }

                // 3. Persist operation record
                exportRepo.save({
                    id: exportId,
                    rotation_plan_id: null,
                    created_at: new Date().toISOString(),
                    status: "created",
                    album_ids: JSON.stringify(albumIds),
                    staging_path: null,
                    archive_path: null,
                    total_size_bytes: preview.totalSizeBytes,
                    file_count: preview.fileCount,
                })

                // 4. Stage export (async, awaited)
                const stageResult = await stageExportAsync(exportId, preview, workspaceGuard)

                exportRepo.save({
                    id: exportId,
                    rotation_plan_id: null,
                    created_at: new Date().toISOString(),
                    status: "staged",
                    album_ids: JSON.stringify(albumIds),
                    staging_path: stageResult.stagingPath,
                    archive_path: null,
                    total_size_bytes: stageResult.manifest.totalSizeBytes,
                    file_count: stageResult.manifest.fileCount,
                })

                // 5. Apply export
                const result = applyExport(exportId, workspaceGuard)

                exportRepo.save({
                    id: exportId,
                    rotation_plan_id: null,
                    created_at: new Date().toISOString(),
                    status: "applied",
                    album_ids: JSON.stringify(albumIds),
                    staging_path: null,
                    archive_path: result.archivePath,
                    total_size_bytes: preview.totalSizeBytes,
                    file_count: preview.fileCount,
                })

                log.info("Headless export completed", {
                    exportId,
                    exportPath: result.exportPath,
                    archivePath: result.archivePath,
                })

                return result
            } catch (err) {
                // Rollback staging if preview exists
                if (preview) {
                    try {
                        rollbackStaging(exportId, workspaceGuard)
                    } catch (rollbackErr) {
                        log.error("Rollback failed for headless export", { exportId }, rollbackErr)
                    }
                }

                // Mark as rolled back if we persisted a record
                try {
                    exportRepo.setStatus(exportId, "rolled_back")
                } catch {
                    // Ignore if record doesn't exist
                }

                log.error("Headless export failed", { exportId }, err)

                throw err
            } finally {
                // 6. Always release the lock
                lockRepo.release()
            }
        },
    }
}