import { schedule } from "node-cron"
import type { BackupService } from "./backupService.js"
import type { BackupStatusRepository } from "../infrastructure/persistence/sqlite/backupStatusRepository.js"
import type { ExportLockRepository } from "../infrastructure/persistence/sqlite/exportLockRepository.js"

export interface BackupScheduler {
    start(): void
    stop(): void
    runManual(): Promise<{ success: boolean; error?: string }>
    getStatus(): {
        enabled: boolean
        cronExpression: string
        lastRun: {
            startedAt: string
            completedAt: string | null
            success: boolean
            error?: string
            path?: string
            sizeBytes?: number
        } | null
    }
}

export function createBackupScheduler(
    backupService: BackupService,
    statusRepo: BackupStatusRepository,
    lockRepo: ExportLockRepository,
    cronExpression: string,
    enabled: boolean,
): BackupScheduler {
    let task: ReturnType<typeof schedule> | null = null
    let isRunning = false

    async function executeBackup(triggerType: "cron" | "manual"): Promise<{ success: boolean; error?: string }> {
        if (isRunning) {
            return { success: false, error: "Backup already in progress" }
        }

        isRunning = true
        const runId = statusRepo.startRun(triggerType)
        let result: { success: boolean; error?: string }

        try {
            // Check export lock — if an export is active, skip this backup
            const currentLock = lockRepo.getCurrent()
            if (currentLock?.export_id) {
                const expiresAt = new Date(currentLock.expires_at)
                if (expiresAt > new Date()) {
                    const msg = `Backup skipped: export ${currentLock.export_id} is in progress`
                    statusRepo.completeRun(runId, false, msg, null, null)
                    isRunning = false
                    return { success: false, error: msg }
                }
            }

            const backupResult = backupService.createBackup()

            if (!backupResult.success) {
                statusRepo.completeRun(
                    runId,
                    false,
                    backupResult.error ?? "Unknown error",
                    null,
                    null,
                )
                result = { success: false, error: backupResult.error }
            } else {
                backupService.rotateBackups()
                statusRepo.completeRun(
                    runId,
                    true,
                    null,
                    backupResult.path,
                    backupResult.sizeBytes,
                )
                result = { success: true }
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err)
            statusRepo.completeRun(runId, false, message, null, null)
            result = { success: false, error: message }
        } finally {
            isRunning = false
        }

        return result
    }

    return {
        start() {
            if (!enabled) {
                console.log("Scheduled backups are disabled (ROTATION_BACKUP_ENABLED=false)")
                return
            }

            try {
                task = schedule(cronExpression, async () => {
                    console.log(`[${new Date().toISOString()}] Running scheduled backup...`)
                    const result = await executeBackup("cron")
                    if (result.success) {
                        console.log("Scheduled backup completed successfully")
                    } else {
                        console.error("Scheduled backup failed:", result.error)
                    }
                })
                console.log(`Backup scheduler started with cron: ${cronExpression}`)
            } catch (err) {
                console.error("Failed to start backup scheduler:", err)
            }
        },

        stop() {
            if (task) {
                task.stop()
                task = null
                console.log("Backup scheduler stopped")
            }
        },

        runManual() {
            return executeBackup("manual")
        },

        getStatus() {
            const latest = statusRepo.getLatest()
            return {
                enabled,
                cronExpression,
                lastRun: latest
                    ? {
                        startedAt: latest.started_at,
                        completedAt: latest.completed_at,
                        success: latest.success === 1,
                        error: latest.error_message ?? undefined,
                        path: latest.backup_path ?? undefined,
                        sizeBytes: latest.size_bytes ?? undefined,
                    }
                    : null,
            }
        },
    }
}
