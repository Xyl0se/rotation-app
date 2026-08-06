import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const cronMock = vi.hoisted(() => {
    const schedule = vi.fn()
    const stop = vi.fn()
    const validate = vi.fn((expression: string) => expression !== "invalid" && expression !== "not-a-cron")
    return { schedule, stop, validate }
})

vi.mock("node-cron", () => ({
    schedule: cronMock.schedule,
    validate: cronMock.validate,
}))

import { buildCronExpression, createJobScheduler } from "./jobScheduler.js"

describe("job scheduler", () => {
    let scheduler: ReturnType<typeof createJobScheduler>

    beforeEach(() => {
        cronMock.schedule.mockReset()
        cronMock.stop.mockReset()
        cronMock.validate.mockClear()
        cronMock.validate.mockImplementation((expression: string) => expression !== "invalid" && expression !== "not-a-cron")
        cronMock.schedule.mockImplementation(() => ({ stop: cronMock.stop }))
        scheduler = createJobScheduler()
    })

    afterEach(() => {
        scheduler.stop()
    })

    it("registers and schedules a job on start", () => {
        scheduler.register({
            name: "test-job",
            cronExpression: "*/1 * * * *",
            timezone: "Europe/Berlin",
            handler: async () => {},
        })

        scheduler.start()

        expect(cronMock.schedule).toHaveBeenCalledWith(
            "*/1 * * * *",
            expect.any(Function),
            { timezone: "Europe/Berlin" },
        )
    })

    it("stops scheduled tasks", () => {
        scheduler.register({
            name: "test-job",
            cronExpression: "*/1 * * * *",
            timezone: "Europe/Berlin",
            handler: async () => {},
        })
        scheduler.start()

        scheduler.stop()

        expect(cronMock.stop).toHaveBeenCalledOnce()
    })

    it("replans a running job without restarting the scheduler", () => {
        scheduler.register({
            name: "test-job",
            cronExpression: "*/2 * * * *",
            timezone: "Europe/Berlin",
            handler: async () => {},
        })
        scheduler.start()

        scheduler.replan("test-job", "*/1 * * * *")

        expect(cronMock.stop).toHaveBeenCalledOnce()
        expect(cronMock.schedule).toHaveBeenLastCalledWith(
            "*/1 * * * *",
            expect.any(Function),
            { timezone: "Europe/Berlin" },
        )
    })

    it("executes manually on demand", async () => {
        const handler = vi.fn(async () => {})
        scheduler.register({
            name: "test-job",
            cronExpression: "0 0 * * *",
            timezone: "Europe/Berlin",
            handler,
        })

        await expect(scheduler.executeNow("test-job")).resolves.toEqual({ success: true })
        expect(handler).toHaveBeenCalledOnce()
    })

    it("returns a failed result when a manual job handler throws", async () => {
        scheduler.register({
            name: "failing-job",
            cronExpression: "0 0 * * *",
            timezone: "Europe/Berlin",
            handler: async () => { throw new Error("boom") },
        })

        await expect(scheduler.executeNow("failing-job")).resolves.toEqual({ success: false, error: "boom" })
    })

    it("rejects invalid cron on register", () => {
        expect(() => scheduler.register({
            name: "bad-job",
            cronExpression: "invalid",
            timezone: "Europe/Berlin",
            handler: async () => {},
        })).toThrow("Invalid cron expression")
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

        expect(scheduler.getStatus("test-job")).toEqual({
            registered: true,
            cronExpression: "0 0 * * *",
            timezone: "Europe/Berlin",
        })
        expect(scheduler.getStatus("unknown")).toEqual({
            registered: false,
            cronExpression: null,
            timezone: null,
        })
    })

    it("builds cron from weekday and time", () => {
        expect(buildCronExpression(0, "20:30")).toBe("30 20 * * 0")
        expect(buildCronExpression(5, "08:00")).toBe("00 08 * * 5")
    })
})
