import { schedule } from "node-cron"
import { createLogger } from "../infrastructure/logger/logger.js"
import type { BackupService } from "./backupService.js"
import type { BackupStatusRepository } from "../infrastructure/persistence/sqlite/backupStatusRepository.js"
import type { ExportLockRepository } from "../infrastructure/persistence/sqlite/exportLockRepository.js"

const schedulerLog = createLogger("backup-scheduler")

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
                schedulerLog.info("Scheduled backups are disabled")
                return
            }

            try {
                task = schedule(cronExpression, async () => {
                    schedulerLog.info("Running scheduled backup")
                    const result = await executeBackup("cron")
                    if (result.success) {
                        schedulerLog.info("Scheduled backup completed successfully")
                    } else {
                        schedulerLog.error("Scheduled backup failed", {}, result.error)
                    }
                })
                schedulerLog.info("Backup scheduler started", { cronExpression })
            } catch (err) {
                schedulerLog.error("Failed to start backup scheduler", {}, err)
            }
        },

        stop() {
            if (task) {
                task.stop()
                task = null
                schedulerLog.info("Backup scheduler stopped")
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
