import { randomUUID } from "node:crypto"
import type { BindingRepository } from "../infrastructure/persistence/sqlite/bindingRepository.js"
import type { ExportOperationRepository } from "../infrastructure/persistence/sqlite/exportOperationRepository.js"
import type { ExportLockRepository } from "../infrastructure/persistence/sqlite/exportLockRepository.js"
import type { PathGuard } from "../infrastructure/filesystem/pathGuard.js"
import {
    previewExport,
    stageExport,
    applyExport,
    rollbackStaging,
    calculateExportDiffForPreview,
    type ExportPreviewResult,
    type ExportStageResult,
    type ExportApplyResult,
} from "../domain/export/exportEngine.js"
import type { ExportDiff } from "../domain/export/exportDiff.js"

export interface StagingProgress {
    status: "staging" | "staged" | "failed"
    filesCopied?: number
    totalFiles?: number
    error?: string
    skippedSources?: Array<{ albumId: string; relativePath: string; artistName: string; albumName: string }>
}

const stagingJobs = new Map<string, StagingProgress>()

export interface ExportService {
    createPreview(albumIds: string[]): ExportPreviewResult
    calculateDiff(albumIds: string[]): ExportDiff
    runStage(exportId: string, albumIds: string[]): void
    getStageStatus(exportId: string): StagingProgress | undefined
    runApply(exportId: string): ExportApplyResult & { diff: ExportDiff }
    listOperations(): ReturnType<ExportOperationRepository["findAll"]>
    findOperation(exportId: string): ReturnType<ExportOperationRepository["findById"]>
}

export function createExportService(
    bindingRepo: BindingRepository,
    exportRepo: ExportOperationRepository,
    lockRepo: ExportLockRepository,
    musicGuard: PathGuard,
    workspaceGuard: PathGuard,
): ExportService {
    return {
        createPreview(albumIds: string[]): ExportPreviewResult {
            const exportId = randomUUID()
            const allBindings = bindingRepo.findAll()
            const bindingMap = new Map(allBindings.map((b) => [b.album_id, b]))
            return previewExport(exportId, albumIds, bindingMap, musicGuard)
        },

        calculateDiff(albumIds: string[]): ExportDiff {
            const allBindings = bindingRepo.findAll()
            const bindingMap = new Map(allBindings.map((b) => [b.album_id, b]))
            return calculateExportDiffForPreview(albumIds, bindingMap, workspaceGuard)
        },

        runStage(exportId: string, albumIds: string[]): void {
            // Acquire lock for this export
            if (!lockRepo.acquire(exportId)) {
                const current = lockRepo.getCurrent()
                throw new Error(
                    `Export is currently locked by another operation: ${current?.export_id ?? "unknown"}`,
                )
            }

            const allBindings = bindingRepo.findAll()
            const bindingMap = new Map(allBindings.map((b) => [b.album_id, b]))
            const preview = previewExport(exportId, albumIds, bindingMap, musicGuard)

            if (!preview.canExport) {
                lockRepo.release()
                stagingJobs.set(exportId, {
                    status: "failed",
                    error: "Export cannot be staged: missing or unconfirmed bindings",
                })
                return
            }

            stagingJobs.set(exportId, { status: "staging", filesCopied: 0, totalFiles: preview.fileCount })

            // Persist operation record
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

            // Run staging asynchronously
            setImmediate(() => {
                try {
                    const result = stageExport(exportId, preview, workspaceGuard)
                    exportRepo.save({
                        id: exportId,
                        rotation_plan_id: null,
                        created_at: new Date().toISOString(),
                        status: "staged",
                        album_ids: JSON.stringify(albumIds),
                        staging_path: result.stagingPath,
                        archive_path: null,
                        total_size_bytes: result.manifest.totalSizeBytes,
                        file_count: result.manifest.fileCount,
                    })
                    stagingJobs.set(exportId, {
                        status: "staged",
                        filesCopied: preview.fileCount,
                        totalFiles: preview.fileCount,
                        skippedSources: result.skippedSources.map((s) => ({
                            albumId: s.albumId,
                            relativePath: s.relativePath,
                            artistName: s.artistName,
                            albumName: s.albumName,
                        })),
                    })
                } catch (err) {
                    const message = err instanceof Error ? err.message : String(err)
                    stagingJobs.set(exportId, { status: "failed", error: message })
                    exportRepo.setStatus(exportId, "rolled_back")
                    try {
                        rollbackStaging(exportId, workspaceGuard)
                    } catch (rollbackErr) {
                        console.error(`Rollback failed for export ${exportId}:`, rollbackErr)
                    } finally {
                        lockRepo.release()
                    }
                }
            })
        },

        getStageStatus(exportId: string): StagingProgress | undefined {
            return stagingJobs.get(exportId)
        },

        runApply(exportId: string): ExportApplyResult & { diff: ExportDiff } {
            // Verify this export holds the lock
            if (!lockRepo.isHeldBy(exportId)) {
                const current = lockRepo.getCurrent()
                throw new Error(
                    `Cannot apply: export ${exportId} does not hold the lock. Current lock: ${current?.export_id ?? "none"}`,
                )
            }

            try {
                const result = applyExport(exportId, workspaceGuard)
                exportRepo.save({
                    id: exportId,
                    rotation_plan_id: null,
                    created_at: new Date().toISOString(),
                    status: "applied",
                    album_ids: exportRepo.findById(exportId)?.album_ids ?? "[]",
                    staging_path: null,
                    archive_path: result.archivePath,
                    total_size_bytes: exportRepo.findById(exportId)?.total_size_bytes ?? null,
                    file_count: exportRepo.findById(exportId)?.file_count ?? null,
                })
                stagingJobs.delete(exportId)
                lockRepo.release()
                return result
            } catch (err) {
                // On failure, keep the lock so the user can investigate
                throw err
            }
        },

        listOperations() {
            return exportRepo.findAll()
        },

        findOperation(exportId: string) {
            return exportRepo.findById(exportId)
        },
    }
}
