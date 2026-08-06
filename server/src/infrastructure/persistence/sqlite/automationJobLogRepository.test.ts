import { describe, expect, it } from "vitest"
import { initDatabase } from "./connection.js"
import { createAutomationJobLogRepository } from "./automationJobLogRepository.js"

describe("automation job log repository", () => {
    it("claims a run atomically", () => {
        const db = initDatabase(":memory:")
        const repo = createAutomationJobLogRepository(db)

        const claim = repo.claimRun("weekly-rotation", "2026-W30")
        expect(claim.claimed).toBe(true)
        expect(claim.id).toBeTruthy()

        const entry = repo.findByExecutionKey("weekly-rotation", "2026-W30")
        expect(entry).toBeTruthy()
        expect(entry!.status).toBe("started")
        expect(entry!.started_at).toBeTruthy()
        db.close()
    })

    it("prevents duplicate claim via unique constraint", () => {
        const db = initDatabase(":memory:")
        const repo = createAutomationJobLogRepository(db)

        const first = repo.claimRun("weekly-rotation", "2026-W30")
        expect(first.claimed).toBe(true)

        const second = repo.claimRun("weekly-rotation", "2026-W30")
        expect(second.claimed).toBe(false)
        expect(second.id).toBeNull()
        db.close()
    })

    it("completes and fails runs", () => {
        const db = initDatabase(":memory:")
        const repo = createAutomationJobLogRepository(db)

        const claim = repo.claimRun("weekly-rotation", "2026-W31")
        repo.completeRun(claim.id!, "rotation-123")

        let entry = repo.findByExecutionKey("weekly-rotation", "2026-W31")
        expect(entry!.status).toBe("completed")
        expect(entry!.finished_at).toBeTruthy()
        expect(entry!.result_reference).toBe("rotation-123")

        const claim2 = repo.claimRun("weekly-rotation", "2026-W32")
        repo.failRun(claim2.id!, "something broke")

        entry = repo.findByExecutionKey("weekly-rotation", "2026-W32")
        expect(entry!.status).toBe("failed")
        expect(entry!.error_message).toBe("something broke")
        db.close()
    })

    it("finds latest, latest completed, latest failed, and running", () => {
        const db = initDatabase(":memory:")
        const repo = createAutomationJobLogRepository(db)

        const c1 = repo.claimRun("weekly-rotation", "2026-W30")
        repo.completeRun(c1.id!)

        // Small delay to ensure distinct started_at ordering
        const start = Date.now()
        while (Date.now() - start < 2) { /* spin */ }

        const c2 = repo.claimRun("weekly-rotation", "2026-W31")
        repo.failRun(c2.id!, "fail")

        expect(repo.findLatest("weekly-rotation")!.execution_key).toBe("2026-W31")
        expect(repo.findLatestCompleted("weekly-rotation")!.execution_key).toBe("2026-W30")
        expect(repo.findLatestFailed("weekly-rotation")!.execution_key).toBe("2026-W31")
        expect(repo.findRunning("weekly-rotation")).toBeUndefined()
        db.close()
    })

    it("considers different job types independent", () => {
        const db = initDatabase(":memory:")
        const repo = createAutomationJobLogRepository(db)

        const c1 = repo.claimRun("weekly-rotation", "2026-W30")
        const c2 = repo.claimRun("daily-export", "2026-W30")

        expect(c1.claimed).toBe(true)
        expect(c2.claimed).toBe(true)

        expect(repo.findLatest("weekly-rotation")!.id).toBe(c1.id)
        expect(repo.findLatest("daily-export")!.id).toBe(c2.id)
        db.close()
    })
})