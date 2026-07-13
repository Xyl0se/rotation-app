import { describe, it, expect, beforeEach } from "vitest"
import { createMetricsStore, resetGlobalMetricsStore, getGlobalMetricsStore } from "./metrics.js"

describe("metrics", () => {
    beforeEach(() => {
        resetGlobalMetricsStore()
    })

    it("records and retrieves a metric", () => {
        const m = createMetricsStore()
        m.record("scan.duration_ms", 1500, "ms", { status: "completed" })
        const snapshot = m.get("scan.duration_ms")
        expect(snapshot).toBeDefined()
        expect(snapshot!.value).toBe(1500)
        expect(snapshot!.unit).toBe("ms")
        expect(snapshot!.labels).toEqual({ status: "completed" })
        expect(snapshot!.timestamp).toBeDefined()
    })

    it("overwrites previous value for same name", () => {
        const m = createMetricsStore()
        m.record("scan.duration_ms", 1000, "ms")
        m.record("scan.duration_ms", 2000, "ms")
        expect(m.get("scan.duration_ms")!.value).toBe(2000)
    })

    it("returns all metrics", () => {
        const m = createMetricsStore()
        m.record("a", 1, "count")
        m.record("b", 2, "bytes")
        const all = m.getAll()
        expect(all).toHaveLength(2)
        expect(all.map((s) => s.name).sort()).toEqual(["a", "b"])
    })

    it("exports as json", () => {
        const m = createMetricsStore()
        m.record("scan.duration_ms", 1500, "ms")
        const json = m.exportJson()
        expect(json["scan.duration_ms"]).toEqual({
            value: 1500,
            unit: "ms",
            labels: undefined,
            timestamp: expect.any(String),
        })
    })

    it("global store is singleton", () => {
        const s1 = getGlobalMetricsStore()
        const s2 = getGlobalMetricsStore()
        expect(s1).toBe(s2)
    })
})
