import { describe, expect, it } from "vitest"
import { getNextRunAt, getLastRunAt } from "./timezoneHelper.js"

describe("timezone helper", () => {
    it("builds cron for Sunday 20:00 Europe/Berlin", () => {
        // 22 July 2026 is a Wednesday
        const base = new Date("2026-07-22T12:00:00Z")
        const next = getNextRunAt(0, "20:00", "Europe/Berlin", base)
        expect(next).not.toBeNull()
        // Next Sunday 20:00 CEST is 18:00 UTC
        expect(next!.getUTCHours()).toBe(18)
        expect(next!.getUTCMinutes()).toBe(0)
        expect(next!.getUTCDay()).toBe(0)
    })

    it("handles Europe/Berlin winter time", () => {
        // 10 January 2026 is a Saturday
        const base = new Date("2026-01-10T12:00:00Z")
        const next = getNextRunAt(0, "20:00", "Europe/Berlin", base)
        expect(next).not.toBeNull()
        // Sunday 20:00 CET is 19:00 UTC
        expect(next!.getUTCHours()).toBe(19)
        expect(next!.getUTCMinutes()).toBe(0)
    })

    it("returns last run before base date", () => {
        const base = new Date("2026-07-22T12:00:00Z") // Wednesday
        const last = getLastRunAt(0, "20:00", "Europe/Berlin", base)
        expect(last).not.toBeNull()
        // Previous Sunday
        expect(last!.getUTCDay()).toBe(0)
        expect(last!.getTime()).toBeLessThan(base.getTime())
    })

    it("finds next run within same week if base is before target day", () => {
        const base = new Date("2026-07-21T12:00:00Z") // Tuesday
        const next = getNextRunAt(3, "08:30", "Europe/Berlin", base)
        expect(next).not.toBeNull()
        expect(next!.getUTCDay()).toBe(3) // Thursday
        expect(next!.getUTCMinutes()).toBe(30)
    })

    it("finds next run in following week if base is after target day", () => {
        const base = new Date("2026-07-24T12:00:00Z") // Friday
        const next = getNextRunAt(1, "08:30", "Europe/Berlin", base)
        expect(next).not.toBeNull()
        expect(next!.getUTCDay()).toBe(1) // Monday
        expect(next!.getTime()).toBeGreaterThan(base.getTime())
    })

    it("handles same-day before time", () => {
        const base = new Date("2026-07-20T10:00:00Z") // Monday 10:00 UTC = 12:00 CEST
        const next = getNextRunAt(1, "14:00", "Europe/Berlin", base)
        expect(next).not.toBeNull()
        // Monday 14:00 CEST = 12:00 UTC
        expect(next!.getUTCDate()).toBe(20)
        expect(next!.getUTCHours()).toBe(12)
    })

    it("handles same-day after time", () => {
        const base = new Date("2026-07-20T18:00:00Z") // Monday 18:00 UTC = 20:00 CEST
        const next = getNextRunAt(1, "14:00", "Europe/Berlin", base)
        expect(next).not.toBeNull()
        // Next Monday
        expect(next!.getUTCDate()).toBe(27)
    })
})