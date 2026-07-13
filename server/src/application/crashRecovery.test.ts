import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, utimesSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { runCrashRecovery } from "./crashRecovery.js"
import type { ExportOperationRepository, ExportOperationRecord } from "../infrastructure/persistence/sqlite/exportOperationRepository.js"
import type { ExportLockRepository, ExportLockRecord } from "../infrastructure/persistence/sqlite/exportLockRepository.js"

function createInMemoryExportRepo(): ExportOperationRepository {
    const ops = new Map<string, ExportOperationRecord>()
    return {
        save(record: ExportOperationRecord): void {
            ops.set(record.id, { ...record })
        },
        findById(id: string): ExportOperationRecord | undefined {
            return ops.get(id)
        },
        findAll(): ExportOperationRecord[] {
            return Array.from(ops.values()).sort((a, b) => b.created_at.localeCompare(a.created_at))
        },
        findLatest(): ExportOperationRecord | undefined {
            return this.findAll()[0]
        },
        setStatus(id: string, status: ExportOperationRecord["status"]): void {
            const op = ops.get(id)
            if (op) op.status = status
        },
    }
}

function createInMemoryLockRepo(): ExportLockRepository {
    let lock: ExportLockRecord | undefined
    return {
        acquire(exportId: string, timeoutMinutes: number = 15): boolean {
            lock = { id: 1, export_id: exportId, acquired_at: new Date().toISOString(), expires_at: new Date(Date.now() + timeoutMinutes * 60_000).toISOString() }
            return true
        },
        release(): void {
            lock = undefined
        },
        getCurrent(): ExportLockRecord | undefined {
            return lock
        },
        isHeldBy(exportId: string): boolean {
            return lock?.export_id === exportId && new Date(lock.expires_at) > new Date()
        },
    }
}

function createPathGuard(base: string) {
    return (relativePath: string): string => join(base, relativePath)
}

describe("runCrashRecovery", () => {
    let base: string
    let repo: ExportOperationRepository
    let lockRepo: ExportLockRepository
    let guard: (rel: string) => string

    beforeEach(() => {
        base = mkdtempSync(join(tmpdir(), "crashrec-"))
        repo = createInMemoryExportRepo()
        lockRepo = createInMemoryLockRepo()
        guard = createPathGuard(base)
    })

    afterEach(() => {
        rmSync(base, { recursive: true, force: true })
    })

    it("completes interrupted apply when next-rotation exists but current-rotation is missing", () => {
        const nextDir = guard("exports/next-rotation")
        const currentDir = guard("exports/current-rotation")
        mkdirSync(nextDir, { recursive: true })
        writeFileSync(join(nextDir, "album.txt"), "test")

        const result = runCrashRecovery(repo, lockRepo, guard)

        expect(result.recovered).toBe(1)
        expect(currentDir).toContain("current-rotation")
        // After rename, next-rotation should be gone and current-rotation should contain the file
        const fs = require("node:fs")
        expect(fs.existsSync(currentDir)).toBe(true)
        expect(fs.existsSync(nextDir)).toBe(false)
        expect(fs.readFileSync(join(currentDir, "album.txt"), "utf-8")).toBe("test")
    })

    it("cleans up orphaned next-rotation when both next-rotation and current-rotation exist", () => {
        const nextDir = guard("exports/next-rotation")
        const currentDir = guard("exports/current-rotation")
        mkdirSync(nextDir, { recursive: true })
        mkdirSync(currentDir, { recursive: true })
        writeFileSync(join(nextDir, "orphan.txt"), "orphan")

        const result = runCrashRecovery(repo, lockRepo, guard)

        expect(result.recovered).toBe(0)
        const fs = require("node:fs")
        expect(fs.existsSync(nextDir)).toBe(false)
        expect(fs.existsSync(currentDir)).toBe(true)
    })

    it("marks staged operations as rolled_back when staging dir is missing", () => {
        repo.save({
            id: "exp-1",
            rotation_plan_id: null,
            created_at: new Date().toISOString(),
            status: "staged",
            album_ids: "[\"a1\"]",
            staging_path: guard("staging-exports/exp-1"),
            archive_path: null,
            total_size_bytes: 100,
            file_count: 1,
        })

        const result = runCrashRecovery(repo, lockRepo, guard)

        expect(result.recovered).toBe(1)
        expect(repo.findById("exp-1")?.status).toBe("rolled_back")
    })

    it("marks created operations as rolled_back", () => {
        repo.save({
            id: "exp-2",
            rotation_plan_id: null,
            created_at: new Date().toISOString(),
            status: "created",
            album_ids: "[\"a1\"]",
            staging_path: null,
            archive_path: null,
            total_size_bytes: null,
            file_count: null,
        })

        const result = runCrashRecovery(repo, lockRepo, guard)

        expect(result.recovered).toBe(1)
        expect(repo.findById("exp-2")?.status).toBe("rolled_back")
    })

    it("releases expired locks", () => {
        lockRepo.acquire("exp-3", 0) // timeout 0 minutes → immediately expired

        const result = runCrashRecovery(repo, lockRepo, guard)

        expect(lockRepo.getCurrent()?.export_id).toBeUndefined()
    })

    it("cleans up staging directories older than 24 hours", () => {
        const stagingBase = guard("staging-exports")
        mkdirSync(stagingBase, { recursive: true })
        const oldDir = join(stagingBase, "old-staging")
        mkdirSync(oldDir, { recursive: true })
        writeFileSync(join(oldDir, "file.txt"), "x")
        // Set mtime to 25 hours ago
        const past = new Date(Date.now() - 25 * 60 * 60 * 1000)
        utimesSync(oldDir, past, past)

        const result = runCrashRecovery(repo, lockRepo, guard)

        expect(result.cleanedStagingDirs).toContain(oldDir)
        const fs = require("node:fs")
        expect(fs.existsSync(oldDir)).toBe(false)
    })

    it("cleans up archives older than 30 days", () => {
        const archiveBase = guard("exports/archive")
        mkdirSync(archiveBase, { recursive: true })
        const oldDir = join(archiveBase, "2024-01-01T00-00-00Z")
        mkdirSync(oldDir, { recursive: true })
        writeFileSync(join(oldDir, "file.txt"), "x")
        const past = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000)
        utimesSync(oldDir, past, past)

        const result = runCrashRecovery(repo, lockRepo, guard)

        expect(result.cleanedArchives).toContain(oldDir)
        const fs = require("node:fs")
        expect(fs.existsSync(oldDir)).toBe(false)
    })

    it("does not clean recent staging or archive directories", () => {
        const stagingBase = guard("staging-exports")
        const archiveBase = guard("exports/archive")
        mkdirSync(stagingBase, { recursive: true })
        mkdirSync(archiveBase, { recursive: true })
        const recentStaging = join(stagingBase, "recent")
        const recentArchive = join(archiveBase, "2024-12-31T00-00-00Z")
        mkdirSync(recentStaging, { recursive: true })
        mkdirSync(recentArchive, { recursive: true })
        writeFileSync(join(recentStaging, "a.txt"), "a")
        writeFileSync(join(recentArchive, "b.txt"), "b")

        const result = runCrashRecovery(repo, lockRepo, guard)

        expect(result.cleanedStagingDirs).toHaveLength(0)
        expect(result.cleanedArchives).toHaveLength(0)
        const fs = require("node:fs")
        expect(fs.existsSync(recentStaging)).toBe(true)
        expect(fs.existsSync(recentArchive)).toBe(true)
    })
})
