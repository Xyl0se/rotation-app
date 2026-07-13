import { Router } from "express"
import type { BackupScheduler } from "../application/backupScheduler.js"
import type { BackupStatusRepository } from "../infrastructure/persistence/sqlite/backupStatusRepository.js"
import type { BackupService } from "../application/backupService.js"

export function createBackupsRouter(
    scheduler: BackupScheduler,
    statusRepo: BackupStatusRepository,
    backupService: BackupService,
) {
    const router = Router()

    /**
     * GET /backups/status
     * Current backup status (enabled/disabled, last run, cron expression)
     */
    router.get("/status", (_req, res) => {
        res.json(scheduler.getStatus())
    })

    /**
     * POST /backups/run
     * Trigger a manual backup immediately.
     */
    router.post("/run", async (_req, res) => {
        const result = await scheduler.runManual()
        if (result.success) {
            res.json({ success: true, message: "Manual backup completed" })
        } else {
            res.status(500).json({ success: false, error: result.error })
        }
    })

    /**
     * GET /backups/history
     * List of recent backup runs with results.
     */
    router.get("/history", (req, res) => {
        const limit = Math.min(parseInt(req.query.limit as string, 10) || 20, 100)
        const history = statusRepo.getHistory(limit).map((row) => ({
            id: row.id,
            startedAt: row.started_at,
            completedAt: row.completed_at,
            success: row.success === 1,
            error: row.error_message,
            path: row.backup_path,
            sizeBytes: row.size_bytes,
            triggerType: row.trigger_type,
        }))
        res.json(history)
    })

    /**
     * GET /backups/list
     * List of actual backup files on disk.
     */
    router.get("/list", (_req, res) => {
        const backups = backupService.listBackups().map((b) => ({
            filename: b.filename,
            createdAt: b.createdAt.toISOString(),
            sizeBytes: b.sizeBytes,
        }))
        res.json(backups)
    })

    return router
}
