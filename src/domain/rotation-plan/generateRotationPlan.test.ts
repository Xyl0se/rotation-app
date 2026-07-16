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

    it("includes Classic but excludes Admired albums", () => {
        const albums = [
            makeAlbum({ id: "new", category: "new" }),
            makeAlbum({ id: "classic", category: "classic" }),
            makeAlbum({ id: "admired", category: "admire" }),
        ]
        expect(generateRotationPlan(albums).albumIds).toEqual(["new", "classic"])
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
        const classicItems = plan.items.filter(item => item.role === "classic")
        expect(newItems.length).toBeGreaterThanOrEqual(2)
        expect(comfortItems.length).toBeGreaterThanOrEqual(2)
        expect(classicItems).toHaveLength(1)
        expect(plan.items.some(item => item.role === "admire")).toBe(false)
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

    it("caps the default mix at 10 New and 5 per other eligible role", () => {
        const roles = ["new", "comfort-food", "classic", "growing"] as const
        const albums = roles.flatMap(role => Array.from({ length: 20 }, (_, i) =>
            makeAlbum({ id: `${role}-${i}`, category: role, listenCount: i })
        ))
        const plan = generateRotationPlan(albums)
        expect(plan.items).toHaveLength(25)
        expect(plan.items.filter(item => item.role === "new")).toHaveLength(10)
        for (const role of roles.slice(1)) {
            expect(plan.items.filter(item => item.role === role)).toHaveLength(5)
        }
    })

    it("generates from a representative 10,000 Album Library within the browser budget", () => {
        const roles = ["new", "comfort-food", "classic", "growing"] as const
        const albums = Array.from({ length: 10_000 }, (_, index) => makeAlbum({
            id: `performance-${index}`,
            category: roles[index % roles.length],
            listenCount: index % 50,
        }))
        const started = performance.now()
        expect(generateRotationPlan(albums).items).toHaveLength(25)
        expect(performance.now() - started).toBeLessThan(500)
    })
})
