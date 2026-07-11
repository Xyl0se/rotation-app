import { describe, expect, it } from "vitest"

import { categorizeRecency, recencyGroups } from "./categorizeRecency"

describe("categorizeRecency", () => {

    const now = new Date("2026-07-07T12:00:00Z")

    it("returns 'never' for null", () => {
        expect(categorizeRecency(null, now)).toBe("never")
    })

    it("returns 'never' for empty string", () => {
        expect(categorizeRecency("", now)).toBe("never")
    })

    it("returns 'today' for last 24 hours", () => {
        const date = "2026-07-06T14:00:00Z"
        expect(categorizeRecency(date, now)).toBe("today")
    })

    it("returns 'today' for exactly 24 hours ago", () => {
        const date = "2026-07-06T12:00:00Z"
        expect(categorizeRecency(date, now)).toBe("today")
    })

    it("returns 'thisWeek' for 2 days ago", () => {
        const date = "2026-07-05T12:00:00Z"
        expect(categorizeRecency(date, now)).toBe("thisWeek")
    })

    it("returns 'thisWeek' for exactly 7 days ago", () => {
        const date = "2026-06-30T12:00:00Z"
        expect(categorizeRecency(date, now)).toBe("thisWeek")
    })

    it("returns 'thisMonth' for 10 days ago", () => {
        const date = "2026-06-27T12:00:00Z"
        expect(categorizeRecency(date, now)).toBe("thisMonth")
    })

    it("returns 'thisMonth' for exactly 30 days ago", () => {
        const date = "2026-06-07T12:00:00Z"
        expect(categorizeRecency(date, now)).toBe("thisMonth")
    })

    it("returns 'thisYear' for 60 days ago", () => {
        const date = "2026-05-08T12:00:00Z"
        expect(categorizeRecency(date, now)).toBe("thisYear")
    })

    it("returns 'thisYear' for exactly 365 days ago", () => {
        const date = "2025-07-07T12:00:00Z"
        expect(categorizeRecency(date, now)).toBe("thisYear")
    })

    it("returns 'older' for more than 365 days ago", () => {
        const date = "2025-07-06T12:00:00Z"
        expect(categorizeRecency(date, now)).toBe("older")
    })

    it("returns 'older' for years ago", () => {
        const date = "2020-01-01T12:00:00Z"
        expect(categorizeRecency(date, now)).toBe("older")
    })

    it("defaults now to new Date() when not provided", () => {
        // We only test that calling without now parameter does not throw
        // and returns a valid result
        const result = categorizeRecency("2020-01-01T12:00:00Z")
        expect(["today", "thisWeek", "thisMonth", "thisYear", "older"]).toContain(result)
    })

})

describe("recencyGroups", () => {

    it("has 6 categories in correct order", () => {
        expect(recencyGroups).toHaveLength(6)
        expect(recencyGroups.map(g => g.key)).toEqual([
            "today",
            "thisWeek",
            "thisMonth",
            "thisYear",
            "older",
            "never",
        ])
    })

    it("has English titles", () => {
        expect(recencyGroups[0].title).toBe("Today")
        expect(recencyGroups[4].title).toBe("Longer Ago")
        expect(recencyGroups[5].title).toBe("Not Yet Listened")
    })

})
