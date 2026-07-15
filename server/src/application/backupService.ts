import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync, unlinkSync } from "node:fs"
import { join } from "node:path"
import Database from "better-sqlite3"
import { createLogger } from "../infrastructure/logger/logger.js"

const backupLog = createLogger("backup-service")

export interface BackupResult {
    success: boolean
    path: string
    sizeBytes: number
    integrityOk: boolean
    error?: string
}

export interface BackupInfo {
    path: string
    filename: string
    createdAt: Date
    sizeBytes: number
}

export interface BackupService {
    createBackup(): BackupResult
    listBackups(): BackupInfo[]
    rotateBackups(): void
    restoreBackup(backupPath: string): { success: boolean; error?: string }
}

export function createBackupService(
    dbPath: string,
    backupDir: string,
    retentionCount: number,
): BackupService {
    function ensureBackupDir(): void {
        if (!existsSync(backupDir)) {
            mkdirSync(backupDir, { recursive: true })
        }
    }

    function generateBackupFilename(): string {
        return `rotation-${Date.now()}.db`
    }

    function parseBackupDate(filename: string): Date | null {
        const match = filename.match(/^rotation-(\d+)\.db$/)
        if (!match) return null
        return new Date(parseInt(match[1], 10))
    }

    return {
        createBackup(): BackupResult {
            ensureBackupDir()

            if (!existsSync(dbPath)) {
                return {
                    success: false,
                    path: "",
                    sizeBytes: 0,
                    integrityOk: false,
                    error: `Database file not found: ${dbPath}`,
                }
            }

            const backupFilename = generateBackupFilename()
            const backupPath = join(backupDir, backupFilename)

            try {
                // WAL checkpoint to ensure all data is in the main DB file
                const db = new Database(dbPath)
                try {
                    db.prepare("PRAGMA wal_checkpoint(TRUNCATE)").run()
                } finally {
                    db.close()
                }

                copyFileSync(dbPath, backupPath)

                // Verify integrity of the backup copy
                const backupDb = new Database(backupPath)
                let integrityOk = false
                try {
                    const result = backupDb.prepare("PRAGMA integrity_check").get() as { integrity_check: string }
                    integrityOk = result.integrity_check === "ok"
                } finally {
                    backupDb.close()
                }

                if (!integrityOk) {
                    unlinkSync(backupPath)
                    return {
                        success: false,
                        path: backupPath,
                        sizeBytes: 0,
                        integrityOk: false,
                        error: "Backup failed integrity check",
                    }
                }

                const stats = statSync(backupPath)
                return {
                    success: true,
                    path: backupPath,
                    sizeBytes: stats.size,
                    integrityOk: true,
                }
            } catch (err) {
                const message = err instanceof Error ? err.message : String(err)
                // Clean up partial backup if it exists
                if (existsSync(backupPath)) {
                    try {
                        unlinkSync(backupPath)
                    } catch {
                        // ignore cleanup error
                    }
                }
                return {
                    success: false,
                    path: backupPath,
                    sizeBytes: 0,
                    integrityOk: false,
                    error: message,
                }
            }
        },

        listBackups(): BackupInfo[] {
            if (!existsSync(backupDir)) {
                return []
            }

            const entries = readdirSync(backupDir)
                .filter((f) => f.endsWith(".db"))
                .map((f) => {
                    const path = join(backupDir, f)
                    const createdAt = parseBackupDate(f)
                    if (!createdAt) return null
                    try {
                        const stats = statSync(path)
                        return {
                            path,
                            filename: f,
                            createdAt,
                            sizeBytes: stats.size,
                        }
                    } catch {
                        return null
                    }
                })
                .filter((b): b is BackupInfo => b !== null)

            return entries.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        },

        rotateBackups(): void {
            const backups = this.listBackups()
            if (backups.length <= retentionCount) {
                return
            }

            const toDelete = backups.slice(retentionCount)
            for (const backup of toDelete) {
                try {
                    unlinkSync(backup.path)
                } catch (err) {
                    backupLog.error("Failed to delete old backup", { path: backup.path }, err)
                }
            }
        },

        restoreBackup(backupPath: string): { success: boolean; error?: string } {
            if (!existsSync(backupPath)) {
                return { success: false, error: `Backup file not found: ${backupPath}` }
            }

            // Verify backup integrity before restoring
            let integrityOk: boolean
            try {
                const backupDb = new Database(backupPath)
                try {
                    const result = backupDb.prepare("PRAGMA integrity_check").get() as { integrity_check: string }
                    integrityOk = result.integrity_check === "ok"
                } finally {
                    backupDb.close()
                }
            } catch (err) {
                const message = err instanceof Error ? err.message : String(err)
                return { success: false, error: `Cannot verify backup integrity: ${message}` }
            }

            if (!integrityOk) {
                return { success: false, error: "Backup failed integrity check" }
            }

            try {
                copyFileSync(backupPath, dbPath)
                return { success: true }
            } catch (err) {
                const message = err instanceof Error ? err.message : String(err)
                return { success: false, error: `Failed to restore backup: ${message}` }
            }
        },
    }
}
