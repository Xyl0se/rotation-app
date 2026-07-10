import { describe, expect, it } from "vitest"
import { makeAlbum } from "../__tests__/factory"
import { evaluateReflection } from "./evaluateReflection"

describe("evaluateReflection", () => {
    const now = new Date("2024-07-01T00:00:00Z")

    it("prompts 'new-after-listens' when new album has >= 3 listens", () => {
        const album = makeAlbum({
            category: "new",
            listenCount: 3,
            roleHistory: [
                { role: "new", recordedAt: "2024-06-01", source: "coach" },
            ],
        })
        const result = evaluateReflection([album], now)
        expect(result.prompts).toHaveLength(1)
        expect(result.prompts[0].code).toBe("new-after-listens")
    })

    it("does not prompt 'new-after-listens' when listenCount < 3", () => {
        const album = makeAlbum({
            category: "new",
            listenCount: 2,
            roleHistory: [
                { role: "new", recordedAt: "2024-06-01", source: "coach" },
            ],
        })
        const result = evaluateReflection([album], now)
        expect(result.prompts).toHaveLength(0)
    })

    it("prompts 'growing-for-a-while' when growing for >= 90 days", () => {
        const album = makeAlbum({
            category: "growing",
            listenCount: 5,
            roleHistory: [
                { role: "growing", recordedAt: "2024-03-01", source: "coach" },
            ],
        })
        const result = evaluateReflection([album], now)
        expect(result.prompts).toHaveLength(1)
        expect(result.prompts[0].code).toBe("growing-for-a-while")
    })

    it("does not prompt 'growing-for-a-while' when less than 90 days", () => {
        const album = makeAlbum({
            category: "growing",
            listenCount: 5,
            roleHistory: [
                { role: "growing", recordedAt: "2024-06-15", source: "coach" },
            ],
        })
        const result = evaluateReflection([album], now)
        expect(result.prompts).toHaveLength(0)
    })

    it("prompts 'comfort-not-recent' when comfort-food not listened for 60+ days", () => {
        const album = makeAlbum({
            category: "comfort-food",
            listenCount: 10,
            lastListened: "2024-04-01",
            roleHistory: [
                { role: "comfort-food", recordedAt: "2024-01-01", source: "coach" },
            ],
        })
        const result = evaluateReflection([album], now)
        expect(result.prompts).toHaveLength(1)
        expect(result.prompts[0].code).toBe("comfort-not-recent")
    })

    it("does not prompt 'comfort-not-recent' when listened recently", () => {
        const album = makeAlbum({
            category: "comfort-food",
            listenCount: 10,
            lastListened: "2024-06-20",
            roleHistory: [
                { role: "comfort-food", recordedAt: "2024-01-01", source: "coach" },
            ],
        })
        const result = evaluateReflection([album], now)
        expect(result.prompts).toHaveLength(0)
    })

    it("prompts 'archive-return-candidate' when archive for >= 180 days", () => {
        const album = makeAlbum({
            category: "archive",
            listenCount: 0,
            roleHistory: [
                { role: "archive", recordedAt: "2023-12-01", source: "archive" },
            ],
        })
        const result = evaluateReflection([album], now)
        expect(result.prompts).toHaveLength(1)
        expect(result.prompts[0].code).toBe("archive-return-candidate")
    })

    it("does not prompt albums whose last role change came from reflection", () => {
        const album = makeAlbum({
            category: "growing",
            listenCount: 5,
            roleHistory: [
                { role: "growing", recordedAt: "2024-03-01", source: "reflection" },
            ],
        })
        const result = evaluateReflection([album], now)
        expect(result.prompts).toHaveLength(0)
    })

    it("returns multiple prompts for different albums", () => {
        const newAlbum = makeAlbum({
            id: "album-new",
            category: "new",
            listenCount: 4,
            roleHistory: [
                { role: "new", recordedAt: "2024-06-01", source: "coach" },
            ],
        })
        const growingAlbum = makeAlbum({
            id: "album-growing",
            category: "growing",
            listenCount: 5,
            roleHistory: [
                { role: "growing", recordedAt: "2024-03-01", source: "coach" },
            ],
        })
        const result = evaluateReflection([newAlbum, growingAlbum], now)
        expect(result.prompts).toHaveLength(2)
    })
})
