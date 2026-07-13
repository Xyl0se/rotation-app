import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { mkdtempSync, writeFileSync, existsSync, statSync, readdirSync, mkdirSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import Database from "better-sqlite3"
import { createBackupService } from "./backupService.js"

function createTempDir(): string {
    return mkdtempSync(join(tmpdir(), "rotation-backup-test-"))
}

function createTestDb(dir: string, name: string = "rotation.db"): string {
    const dbPath = join(dir, name)
    const db = new Database(dbPath)
    db.exec(`
        CREATE TABLE IF NOT EXISTS test_data (
            id INTEGER PRIMARY KEY,
            value TEXT NOT NULL
        );
        INSERT INTO test_data (value) VALUES ('hello'), ('world');
    `)
    db.close()
    return dbPath
}

describe("createBackupService", () => {
    let tempDir: string
    let dbPath: string
    let backupDir: string

    beforeEach(() => {
        tempDir = createTempDir()
        dbPath = createTestDb(tempDir)
        backupDir = join(tempDir, "backups")
    })

    afterEach(() => {
        // Vitest does not clean up temp files automatically
        // We rely on OS tmp cleanup; no explicit rmSync to avoid issues
    })

    describe("createBackup", () => {
        it("creates a backup that passes integrity check", () => {
            const service = createBackupService(dbPath, backupDir, 7)
            const result = service.createBackup()

            expect(result.success).toBe(true)
            expect(result.integrityOk).toBe(true)
            expect(existsSync(result.path)).toBe(true)
            expect(result.sizeBytes).toBeGreaterThan(0)
        })

        it("returns error when database does not exist", () => {
            const service = createBackupService(join(tempDir, "missing.db"), backupDir, 7)
            const result = service.createBackup()

            expect(result.success).toBe(false)
            expect(result.error).toContain("not found")
        })

        it("creates backup directory if missing", () => {
            const customBackupDir = join(tempDir, "nested", "backups")
            const service = createBackupService(dbPath, customBackupDir, 7)
            const result = service.createBackup()

            expect(result.success).toBe(true)
            expect(existsSync(customBackupDir)).toBe(true)
        })

        it("backup contains same data as original", () => {
            const service = createBackupService(dbPath, backupDir, 7)
            const result = service.createBackup()

            const backupDb = new Database(result.path)
            const rows = backupDb.prepare("SELECT * FROM test_data ORDER BY id").all() as Array<{ id: number; value: string }>
            backupDb.close()

            expect(rows).toHaveLength(2)
            expect(rows[0].value).toBe("hello")
            expect(rows[1].value).toBe("world")
        })
    })

    describe("listBackups", () => {
        it("returns empty array when no backups exist", () => {
            const service = createBackupService(dbPath, backupDir, 7)
            expect(service.listBackups()).toEqual([])
        })

        it("lists backups sorted newest first", () => {
            const service = createBackupService(dbPath, backupDir, 7)
            service.createBackup()
            // Small delay to ensure different timestamps
            const start = Date.now()
            while (Date.now() - start < 50) { /* busy wait */ }
            service.createBackup()

            const backups = service.listBackups()
            expect(backups).toHaveLength(2)
            expect(backups[0].createdAt.getTime()).toBeGreaterThanOrEqual(backups[1].createdAt.getTime())
        })

        it("ignores non-backup files", () => {
            const service = createBackupService(dbPath, backupDir, 7)
            service.createBackup()
            writeFileSync(join(backupDir, "random.txt"), "not a backup")

            const backups = service.listBackups()
            expect(backups).toHaveLength(1)
        })
    })

    describe("rotateBackups", () => {
        it("keeps exactly retentionCount backups", () => {
            const service = createBackupService(dbPath, backupDir, 3)

            for (let i = 0; i < 5; i++) {
                service.createBackup()
                const start = Date.now()
                while (Date.now() - start < 50) { /* busy wait */ }
            }

            service.rotateBackups()
            const backups = service.listBackups()
            expect(backups).toHaveLength(3)
        })

        it("does nothing when backup count is within retention", () => {
            const service = createBackupService(dbPath, backupDir, 7)
            service.createBackup()

            service.rotateBackups()
            expect(service.listBackups()).toHaveLength(1)
        })

        it("deletes oldest backups", () => {
            const service = createBackupService(dbPath, backupDir, 2)

            for (let i = 0; i < 4; i++) {
                service.createBackup()
                const start = Date.now()
                while (Date.now() - start < 50) { /* busy wait */ }
            }

            const beforeRotate = service.listBackups()
            service.rotateBackups()
            const afterRotate = service.listBackups()

            expect(afterRotate).toHaveLength(2)
            // The two newest should remain
            expect(afterRotate[0].path).toBe(beforeRotate[0].path)
            expect(afterRotate[1].path).toBe(beforeRotate[1].path)
        })
    })

    describe("restoreBackup", () => {
        it("restores backup over original database", () => {
            const service = createBackupService(dbPath, backupDir, 7)
            const backupResult = service.createBackup()

            // Modify original database
            const db = new Database(dbPath)
            db.exec("INSERT INTO test_data (value) VALUES ('extra')")
            db.close()

            const restoreResult = service.restoreBackup(backupResult.path)
            expect(restoreResult.success).toBe(true)

            const restoredDb = new Database(dbPath)
            const rows = restoredDb.prepare("SELECT * FROM test_data ORDER BY id").all() as Array<{ id: number; value: string }>
            restoredDb.close()

            expect(rows).toHaveLength(2)
            expect(rows.some((r) => r.value === "extra")).toBe(false)
        })

        it("refuses to restore non-existent backup", () => {
            const service = createBackupService(dbPath, backupDir, 7)
            const result = service.restoreBackup(join(backupDir, "nonexistent.db"))

            expect(result.success).toBe(false)
            expect(result.error).toContain("not found")
        })

        it("refuses to restore backup that fails integrity check", () => {
            const service = createBackupService(dbPath, backupDir, 7)
            mkdirSync(backupDir, { recursive: true })
            const corruptBackup = join(backupDir, "rotation-corrupt.db")
            writeFileSync(corruptBackup, "this is not a valid sqlite database")

            const result = service.restoreBackup(corruptBackup)
            expect(result.success).toBe(false)
            expect(result.error).toContain("integrity")
        })
    })
})
