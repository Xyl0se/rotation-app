import { describe, it, expect, beforeEach } from "vitest"
import Database from "better-sqlite3"
import { initDatabase } from "./connection.js"
import { createExportLockRepository } from "./exportLockRepository.js"

describe("ExportLockRepository", () => {
    let db: Database.Database
    let repo: ReturnType<typeof createExportLockRepository>

    beforeEach(() => {
        db = initDatabase(":memory:")
        repo = createExportLockRepository(db)
    })

    it("acquires lock when free", () => {
        const acquired = repo.acquire("exp-1")
        expect(acquired).toBe(true)
    })

    it("fails to acquire when held by another export", () => {
        repo.acquire("exp-1")
        const acquired = repo.acquire("exp-2")
        expect(acquired).toBe(false)
    })

    it("acquires when held by same export (idempotent)", () => {
        repo.acquire("exp-1")
        const acquired = repo.acquire("exp-1")
        expect(acquired).toBe(true)
    })

    it("acquires after release", () => {
        repo.acquire("exp-1")
        repo.release()
        const acquired = repo.acquire("exp-2")
        expect(acquired).toBe(true)
        expect(repo.isHeldBy("exp-2")).toBe(true)
    })

    it("reports isHeldBy correctly", () => {
        repo.acquire("exp-1")
        expect(repo.isHeldBy("exp-1")).toBe(true)
        expect(repo.isHeldBy("exp-2")).toBe(false)
    })

    it("steals expired lock from another export", () => {
        // Acquire with 0 timeout so it expires immediately
        repo.acquire("exp-1", 0)
        // Small delay to ensure expiration
        const acquired = repo.acquire("exp-2")
        expect(acquired).toBe(true)
        expect(repo.isHeldBy("exp-2")).toBe(true)
    })

    it("getCurrent returns current lock state", () => {
        const before = repo.getCurrent()
        expect(before).toBeUndefined()

        repo.acquire("exp-1")
        const after = repo.getCurrent()
        expect(after?.export_id).toBe("exp-1")
        expect(after?.expires_at).toBeDefined()
    })
})
