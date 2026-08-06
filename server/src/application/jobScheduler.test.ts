import { describe, expect, it, beforeEach, afterEach } from "vitest"
import { createJobScheduler, buildCronExpression } from "./jobScheduler.js"

describe("job scheduler", () => {
    let scheduler: ReturnType<typeof createJobScheduler>

    beforeEach(() => {
        scheduler = createJobScheduler()
    })

    afterEach(() => {
        scheduler.stop()
    })

    it("registers and starts a job", async () => {
        let calls = 0
        scheduler.register({
            name: "test-job",
            cronExpression: "*/1 * * * *",
            timezone: "Europe/Berlin",
            handler: async () => { calls++ },
        })
        scheduler.start()
        // Wait for the job to trigger at least once
        await new Promise((r) => setTimeout(r, 65_000))
        expect(calls).toBeGreaterThanOrEqual(1)
    }, 70_000)

    it("stops preventing further execution", async () => {
        let calls = 0
        scheduler.register({
            name: "test-job",
            cronExpression: "*/1 * * * *",
            timezone: "Europe/Berlin",
            handler: async () => { calls++ },
        })
        scheduler.start()
        await new Promise((r) => setTimeout(r, 1_000))
        scheduler.stop()
        const afterStop = calls
        await new Promise((r) => setTimeout(r, 65_000))
        expect(calls).toBe(afterStop)
    }, 70_000)

    it("replans without restart", async () => {
        let calls = 0
        scheduler.register({
            name: "test-job",
            cronExpression: "*/2 * * * *",
            timezone: "Europe/Berlin",
            handler: async () => { calls++ },
        })
        scheduler.start()
        await new Promise((r) => setTimeout(r, 1_000))
        scheduler.replan("test-job", "*/1 * * * *")
        await new Promise((r) => setTimeout(r, 65_000))
        expect(calls).toBeGreaterThanOrEqual(1)
    }, 70_000)

    it("executes manually on demand", async () => {
        let called = false
        scheduler.register({
            name: "test-job",
            cronExpression: "0 0 * * *",
            timezone: "Europe/Berlin",
            handler: async () => { called = true },
        })
        const result = await scheduler.executeNow("test-job")
        expect(result.success).toBe(true)
        expect(called).toBe(true)
    })

    it("catches errors and continues", async () => {
        let calls = 0
        scheduler.register({
            name: "failing-job",
            cronExpression: "*/1 * * * *",
            timezone: "Europe/Berlin",
            handler: async () => {
                calls++
                throw new Error("boom")
            },
        })
        scheduler.start()
        await new Promise((r) => setTimeout(r, 65_000))
        expect(calls).toBeGreaterThanOrEqual(1)
    }, 70_000)

    it("rejects invalid cron on register", () => {
        expect(() =>
            scheduler.register({
                name: "bad-job",
                cronExpression: "invalid",
                timezone: "Europe/Berlin",
                handler: async () => {},
            })
        ).toThrow("Invalid cron expression")
    })

    it("rejects replan with invalid cron", () => {
        scheduler.register({
            name: "test-job",
            cronExpression: "0 0 * * *",
            timezone: "Europe/Berlin",
            handler: async () => {},
        })
        expect(() => scheduler.replan("test-job", "not-a-cron")).toThrow("Invalid cron expression")
    })

    it("returns status for registered and unknown jobs", () => {
        scheduler.register({
            name: "test-job",
            cronExpression: "0 0 * * *",
            timezone: "Europe/Berlin",
            handler: async () => {},
        })
        const status = scheduler.getStatus("test-job")
        expect(status.registered).toBe(true)
        expect(status.cronExpression).toBe("0 0 * * *")

        const unknown = scheduler.getStatus("unknown")
        expect(unknown.registered).toBe(false)
    })

    it("builds cron from weekday and time", () => {
        expect(buildCronExpression(0, "20:30")).toBe("30 20 * * 0")
        expect(buildCronExpression(5, "08:00")).toBe("00 08 * * 5")
    })
})