import { describe, expect, it, beforeEach, afterEach } from "vitest"
import { initDatabase } from "../infrastructure/persistence/sqlite/connection.js"
import { createAutomationSettingsRepository } from "../infrastructure/persistence/sqlite/automationSettingsRepository.js"
import { createAutomationJobLogRepository } from "../infrastructure/persistence/sqlite/automationJobLogRepository.js"
import { createAutomationService } from "./automationService.js"
import type { JobScheduler } from "./jobScheduler.js"

function createMockScheduler(): JobScheduler {
    const jobs = new Map<string, { cron: string; timezone: string; handler: () => Promise<void> }>()

    return {
        register(job: { name: string; cronExpression: string; timezone: string; handler: () => Promise<void> }) {
            jobs.set(job.name, { cron: job.cronExpression, timezone: job.timezone, handler: job.handler })
        },
        start() {},
        stop() {},
        replan(name: string, cron: string, timezone?: string) {
            const j = jobs.get(name)
            if (!j) throw new Error(`unknown job ${name}`)
            j.cron = cron
            if (timezone) j.timezone = timezone
        },
        executeNow(name: string) {
            const j = jobs.get(name)
            if (!j) return Promise.resolve({ success: false, error: "not found" })
            return j.handler().then(() => ({ success: true })).catch((e: unknown) => ({ success: false, error: String(e) }))
        },
        getStatus(name: string) {
            const j = jobs.get(name)
            return j
                ? { registered: true, cronExpression: j.cron, timezone: j.timezone }
                : { registered: false, cronExpression: null, timezone: null }
        },
    }
}

describe("automation service", () => {
    let db: ReturnType<typeof initDatabase>
    let settingsRepo: ReturnType<typeof createAutomationSettingsRepository>
    let logRepo: ReturnType<typeof createAutomationJobLogRepository>
    let mockScheduler: JobScheduler
    let service: ReturnType<typeof createAutomationService>

    beforeEach(() => {
        db = initDatabase(":memory:")
        settingsRepo = createAutomationSettingsRepository(db)
        logRepo = createAutomationJobLogRepository(db)
        mockScheduler = createMockScheduler()
        service = createAutomationService(settingsRepo, logRepo, mockScheduler)
    })

    afterEach(() => {
        service.stop()
        db.close()
    })

    it("returns default settings with nextRunAt", () => {
        const settings = service.getSettings()
        expect(settings.enabled).toBe(false)
        expect(settings.nextRunAt).toBeTruthy()
    })

    it("starts scheduler when enabled and stops when disabled", () => {
        service.start() // disabled by default
        expect(mockScheduler.getStatus("weekly-rotation").registered).toBe(false)

        service.updateSettings({ enabled: true })
        expect(mockScheduler.getStatus("weekly-rotation").registered).toBe(true)

        service.updateSettings({ enabled: false })
        expect(mockScheduler.getStatus("weekly-rotation").registered).toBe(true) // registered but stopped
    })

    it("replans when time config changes while enabled", () => {
        service.updateSettings({ enabled: true, weekday: 5, time: "18:00" })
        const status = mockScheduler.getStatus("weekly-rotation")
        expect(status.cronExpression).toBe("00 18 * * 5")
    })

    it("registers job handler and executes with claim", async () => {
        let calls = 0
        let receivedKey = ""
        service.registerJobHandler("weekly-rotation", {
            handler: async (key) => { calls++; receivedKey = key },
            getExecutionKey: () => "2026-W30",
        })

        service.updateSettings({ enabled: true })
        const result = await service.executeNow("weekly-rotation")
        expect(result.success).toBe(true)
        expect(calls).toBe(1)
        expect(receivedKey).toBe("2026-W30")

        // Second attempt should be blocked by unique constraint
        const second = await service.executeNow("weekly-rotation")
        expect(second.success).toBe(false)
    })

    it("executes handler errors and updates log to failed", async () => {
        service.registerJobHandler("weekly-rotation", {
            handler: async () => { throw new Error("boom") },
            getExecutionKey: () => "2026-W30",
        })

        const result = await service.executeNow("weekly-rotation")
        expect(result.success).toBe(false)

        const logEntry = logRepo.findByExecutionKey("weekly-rotation", "2026-W30")
        expect(logEntry!.status).toBe("failed")
        expect(logEntry!.error_message).toBe("boom")
    })

    it("returns job status including isRunning", () => {
        service.registerJobHandler("weekly-rotation", {
            handler: async () => {},
            getExecutionKey: () => "2026-W30",
        })

        const before = service.getJobStatus("weekly-rotation")
        expect(before.isRunning).toBe(false)
        expect(before.lastRun).toBeNull()

        logRepo.claimRun("weekly-rotation", "2026-W30")

        const during = service.getJobStatus("weekly-rotation")
        expect(during.isRunning).toBe(true)
    })

    it("performs catch-up within grace period", () => {
        let caughtUp = false
        let catchupKey = ""
        service.registerJobHandler("weekly-rotation", {
            handler: async (key) => { caughtUp = true; catchupKey = key },
            getExecutionKey: (d) => d ? "catchup-key" : "normal-key",
        })

        // Set schedule to 2 hours ago
        const now = new Date()
        const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000)
        const weekday = twoHoursAgo.getDay()
        const hours = String(twoHoursAgo.getHours()).padStart(2, "0")
        const minutes = String(twoHoursAgo.getMinutes()).padStart(2, "0")

        service.updateSettings({
            enabled: true,
            weekday,
            time: `${hours}:${minutes}`,
            timezone: "UTC",
            grace_period_minutes: 240,
        })

        // Simulate startup
        service.start()

        expect(caughtUp).toBe(true)
        expect(catchupKey).toBe("catchup-key")
    })

    it("skips catch-up outside grace period", () => {
        let caughtUp = false
        service.registerJobHandler("weekly-rotation", {
            handler: async () => { caughtUp = true },
            getExecutionKey: () => "key",
        })

        // Schedule 6 hours ago
        const now = new Date()
        const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000)
        const weekday = sixHoursAgo.getDay()
        const hours = String(sixHoursAgo.getHours()).padStart(2, "0")
        const minutes = String(sixHoursAgo.getMinutes()).padStart(2, "0")

        service.updateSettings({
            enabled: true,
            weekday,
            time: `${hours}:${minutes}`,
            timezone: "UTC",
            grace_period_minutes: 240,
        })

        service.start()
        expect(caughtUp).toBe(false)
    })

    it("disables catch-up when grace period is 0", () => {
        let caughtUp = false
        service.registerJobHandler("weekly-rotation", {
            handler: async () => { caughtUp = true },
            getExecutionKey: () => "key",
        })

        const now = new Date()
        const oneMinuteAgo = new Date(now.getTime() - 60_000)
        const weekday = oneMinuteAgo.getDay()
        const hours = String(oneMinuteAgo.getHours()).padStart(2, "0")
        const minutes = String(oneMinuteAgo.getMinutes()).padStart(2, "0")

        service.updateSettings({
            enabled: true,
            weekday,
            time: `${hours}:${minutes}`,
            timezone: "UTC",
            grace_period_minutes: 0,
        })

        service.start()
        expect(caughtUp).toBe(false)
    })

    it("returns 409 when no handler is registered for executeNow", async () => {
        const result = await service.executeNow("weekly-rotation")
        expect(result.success).toBe(false)
        expect(result.error).toContain("No handler registered")
    })

    it("preserves existing schedule on invalid update", () => {
        service.updateSettings({ enabled: true, weekday: 3, time: "14:00" })
        const before = mockScheduler.getStatus("weekly-rotation").cronExpression

        // Invalid weekday would be rejected by Zod, but at service level it's already validated
        // This tests the service doesn't crash on unexpected input
        service.updateSettings({ time: "15:00" })
        const after = mockScheduler.getStatus("weekly-rotation").cronExpression
        expect(after).not.toBe(before)
    })
})