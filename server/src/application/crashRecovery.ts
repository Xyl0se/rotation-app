import { existsSync, rmSync, readdirSync, statSync } from "node:fs"
import { join } from "node:path"
import type { ExportOperationRepository } from "../infrastructure/persistence/sqlite/exportOperationRepository.js"
import type { ExportLockRepository } from "../infrastructure/persistence/sqlite/exportLockRepository.js"
import type { PathGuard } from "../infrastructure/filesystem/pathGuard.js"

const STALE_STAGING_HOURS = 24
const OLD_ARCHIVE_DAYS = 30

export function runCrashRecovery(
    exportRepo: ExportOperationRepository,
    lockRepo: ExportLockRepository,
    workspaceGuard: PathGuard,
): { recovered: number; cleanedStagingDirs: string[]; cleanedArchives: string[] } {
    const cleanedStagingDirs: string[] = []
    const cleanedArchives: string[] = []

    // 1. Check for incomplete operations
    const allOps = exportRepo.findAll()
    let recovered = 0

    for (const op of allOps) {
        if (op.status === "staged") {
            // A staged operation was never applied — it may be abandoned or in progress
            // We don't auto-rollback because the staging might still be valid,
            // but we mark it as rolled_back if the staging dir no longer exists
            if (op.staging_path && !existsSync(op.staging_path)) {
                exportRepo.setStatus(op.id, "rolled_back")
                recovered++
            }
        }
        if (op.status === "created") {
            // Operation was recorded but staging never completed
            exportRepo.setStatus(op.id, "rolled_back")
            recovered++
        }
    }

    // 2. Release any expired locks
    const lock = lockRepo.getCurrent()
    if (lock?.expires_at) {
        const expires = new Date(lock.expires_at)
        if (expires <= new Date()) {
            lockRepo.release()
        }
    }

    // 3. Clean up orphaned staging directories older than 24h
    const stagingBase = workspaceGuard("staging-exports")
    if (existsSync(stagingBase)) {
        const now = Date.now()
        const staleThreshold = STALE_STAGING_HOURS * 60 * 60 * 1000
        for (const entry of readdirSync(stagingBase, { withFileTypes: true })) {
            if (entry.isDirectory()) {
                const dirPath = join(stagingBase, entry.name)
                const stat = statSync(dirPath)
                const age = now - stat.mtime.getTime()
                if (age > staleThreshold) {
                    rmSync(dirPath, { recursive: true, force: true })
                    cleanedStagingDirs.push(dirPath)
                }
            }
        }
    }

    // 4. Clean up old archives older than 30 days
    const archiveBase = workspaceGuard("exports/archive")
    if (existsSync(archiveBase)) {
        const now = Date.now()
        const oldThreshold = OLD_ARCHIVE_DAYS * 24 * 60 * 60 * 1000
        for (const entry of readdirSync(archiveBase, { withFileTypes: true })) {
            if (entry.isDirectory()) {
                const dirPath = join(archiveBase, entry.name)
                const stat = statSync(dirPath)
                const age = now - stat.mtime.getTime()
                if (age > oldThreshold) {
                    rmSync(dirPath, { recursive: true, force: true })
                    cleanedArchives.push(dirPath)
                }
            }
        }
    }

    return { recovered, cleanedStagingDirs, cleanedArchives }
}
