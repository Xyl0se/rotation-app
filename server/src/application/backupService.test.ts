import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { mkdtempSync, writeFileSync, existsSync, mkdirSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import Database from "better-sqlite3"
import { createBackupService } from "./backupService.js"
import { initDatabase } from "../infrastructure/persistence/sqlite/connection.js"
import { createAlbumRepository } from "../infrastructure/persistence/sqlite/albumRepository.js"
import { createRotationStateRepository } from "../infrastructure/persistence/sqlite/rotationStateRepository.js"
import { createReflectionInboxRepository } from "../infrastructure/persistence/sqlite/reflectionInboxRepository.js"
import { createReflectionInboxService } from "./reflectionInboxService.js"

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

        it("restores the complete lifecycle, settings, audit, export, Focus, and listening state", () => {
            const albumId = "550e8400-e29b-41d4-a716-446655440010"
            const planId = "550e8400-e29b-41d4-a716-446655440020"
            const eventId = "550e8400-e29b-41d4-a716-446655440030"
            const canonicalPath = join(tempDir, "canonical.db")
            const canonicalDb = initDatabase(canonicalPath)
            createAlbumRepository(canonicalDb).save({
                id: albumId, title: "Album", artist: "Artist", year: "2026",
                category: "new", roleHistory: [{ role:"new",recordedAt:"2025-01-01T00:00:00.000Z",source:"coach" }], listenCount: 3, lastListened: "2026-01-01T00:00:00.000Z",
            })
            const repository = createRotationStateRepository(canonicalDb)
            repository.savePlan({
                id: planId, name: "Rotation", targetSize: 1,
                albumIds: [albumId], items: [{ albumId, role: "new", reason: "quota" }],
                roleQuotas: [{ role: "new", targetCount: 1 }],
                createdAt: "2026-07-16T10:00:00.000Z", acceptedAt: "2026-07-16T10:01:00.000Z",
                status: "active", focusAlbumId: albumId,
            })
            repository.saveListenEvent({ id: eventId, albumId, listenedAt: "2026-07-16T11:00:00.000Z" })
            canonicalDb.prepare("UPDATE rotation_settings SET target_size=1, role_quotas_json=? WHERE singleton=1")
                .run('[{"role":"new","targetCount":1}]')
            canonicalDb.prepare("INSERT INTO domain_audit_events VALUES (?,?,?,?,?,?,NULL)")
                .run("audit-1", "rotation-accepted", planId, '{"status":"draft"}', '{"status":"active"}', "2026-07-16T10:01:00.000Z")
            canonicalDb.prepare("INSERT INTO export_operations (id,rotation_plan_id,created_at,status,album_ids,total_size_bytes,file_count) VALUES (?,?,?,?,?,?,?)")
                .run("export-1", planId, "2026-07-16T12:00:00.000Z", "applied", JSON.stringify([albumId]), 1024, 1)
            const reflectionRepository=createReflectionInboxRepository(canonicalDb)
            const [reflection]=createReflectionInboxService(createAlbumRepository(canonicalDb),reflectionRepository).evaluate(new Date("2026-07-16T13:00:00.000Z"))
            reflectionRepository.transition(reflection.id,"snoozed","2026-07-16T13:01:00.000Z",{snoozedUntil:"2026-08-16T13:00:00.000Z"})
            canonicalDb.close()

            const canonicalService = createBackupService(canonicalPath, backupDir, 7)
            const backup = canonicalService.createBackup()
            expect(backup.success).toBe(true)

            const changedDb = new Database(canonicalPath)
            changedDb.exec("DELETE FROM reflection_inbox_items; DELETE FROM export_operations; DELETE FROM domain_audit_events; DELETE FROM rotation_plans; DELETE FROM listen_events; UPDATE rotation_settings SET target_size=25")
            changedDb.close()
            expect(canonicalService.restoreBackup(backup.path).success).toBe(true)

            const restored = initDatabase(canonicalPath)
            const restoredRepository = createRotationStateRepository(restored)
            expect(restoredRepository.findActive()).toMatchObject({ id: planId, focusAlbumId: albumId })
            expect(restoredRepository.findListenEvents()).toEqual([{ id: eventId, albumId, listenedAt: "2026-07-16T11:00:00.000Z" }])
            expect(restored.prepare("SELECT target_size FROM rotation_settings WHERE singleton=1").get()).toEqual({ target_size: 1 })
            expect(restored.prepare("SELECT event_type FROM domain_audit_events WHERE id='audit-1'").get()).toEqual({ event_type: "rotation-accepted" })
            expect(restored.prepare("SELECT rotation_plan_id, status FROM export_operations WHERE id='export-1'").get()).toEqual({ rotation_plan_id: planId, status: "applied" })
            expect(restored.prepare("SELECT state,snoozed_until FROM reflection_inbox_items WHERE id=?").get(reflection.id)).toEqual({state:"snoozed",snoozed_until:"2026-08-16T13:00:00.000Z"})
            restored.close()
        })
    })
})
