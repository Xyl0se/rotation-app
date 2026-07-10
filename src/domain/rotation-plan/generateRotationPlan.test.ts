import { describe, expect, it } from "vitest"
import { makeAlbum } from "../__tests__/factory"
import { generateRotationPlan } from "./generateRotationPlan"
import { defaultRotationTargetSize } from "./rotationPlan"

describe("generateRotationPlan", () => {
    it("generates a draft plan with default target size", () => {
        const albums = [
            makeAlbum({ id: "a1", category: "new", listenCount: 0 }),
            makeAlbum({ id: "a2", category: "comfort-food", listenCount: 1 }),
            makeAlbum({ id: "a3", category: "classic", listenCount: 2 }),
        ]
        const plan = generateRotationPlan(albums)
        expect(plan.status).toBe("draft")
        expect(plan.targetSize).toBe(defaultRotationTargetSize)
        expect(plan.items).toHaveLength(3)
    })

    it("excludes archive albums", () => {
        const albums = [
            makeAlbum({ id: "a1", category: "new" }),
            makeAlbum({ id: "a2", category: "archive" }),
        ]
        const plan = generateRotationPlan(albums)
        expect(plan.items.some(item => item.albumId === "a2")).toBe(false)
    })

    it("excludes albums without a category", () => {
        const albums = [
            makeAlbum({ id: "a1", category: "new" }),
            makeAlbum({ id: "a2", category: undefined }),
        ]
        const plan = generateRotationPlan(albums)
        expect(plan.items.some(item => item.albumId === "a2")).toBe(false)
    })

    it("fills according to role quotas", () => {
        const albums = [
            makeAlbum({ id: "n1", category: "new", listenCount: 0 }),
            makeAlbum({ id: "n2", category: "new", listenCount: 1 }),
            makeAlbum({ id: "n3", category: "new", listenCount: 2 }),
            makeAlbum({ id: "c1", category: "comfort-food", listenCount: 0 }),
            makeAlbum({ id: "c2", category: "comfort-food", listenCount: 1 }),
            makeAlbum({ id: "cl1", category: "classic", listenCount: 0 }),
            makeAlbum({ id: "g1", category: "growing", listenCount: 0 }),
            makeAlbum({ id: "a1", category: "admire", listenCount: 0 }),
        ]
        const plan = generateRotationPlan(albums)
        const newItems = plan.items.filter(item => item.role === "new")
        const comfortItems = plan.items.filter(item => item.role === "comfort-food")
        expect(newItems.length).toBeGreaterThanOrEqual(2)
        expect(comfortItems.length).toBeGreaterThanOrEqual(2)
    })

    it("prefers albums with lower listenCount", () => {
        const albums = [
            makeAlbum({ id: "a1", category: "new", listenCount: 5 }),
            makeAlbum({ id: "a2", category: "new", listenCount: 1 }),
            makeAlbum({ id: "a3", category: "new", listenCount: 0 }),
        ]
        const plan = generateRotationPlan(albums)
        const firstItem = plan.items[0]
        expect(firstItem.albumId).toBe("a3")
    })

    it("uses custom options when provided", () => {
        const albums = [
            makeAlbum({ id: "a1", category: "new" }),
        ]
        const plan = generateRotationPlan(albums, {
            name: "My Rotation",
            targetSize: 5,
        })
        expect(plan.name).toBe("My Rotation")
        expect(plan.targetSize).toBe(5)
    })

    it("fills remaining slots after quotas", () => {
        const albums = Array.from({ length: 40 }, (_, i) =>
            makeAlbum({
                id: `album-${i}`,
                category: i % 2 === 0 ? "new" : "comfort-food",
                listenCount: i,
            })
        )
        const plan = generateRotationPlan(albums)
        expect(plan.items.length).toBeLessThanOrEqual(defaultRotationTargetSize)
    })
})
