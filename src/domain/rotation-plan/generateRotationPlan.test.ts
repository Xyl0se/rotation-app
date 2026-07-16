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
        const plan = generateRotationPlan(albums, { random: () => .5 })
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
        const plan = generateRotationPlan(albums, { random: () => .5 })
        const firstItem = plan.items[0]
        expect(firstItem.albumId).toBe("a3")
    })

    it("fills quota gaps from other eligible roles up to the target size", () => {
        const albums = [
            ...Array.from({ length: 2 }, (_, index) => makeAlbum({ id: `new-${index}`, category: "new" })),
            ...Array.from({ length: 8 }, (_, index) => makeAlbum({ id: `classic-${index}`, category: "classic" })),
        ]
        const plan = generateRotationPlan(albums, {
            targetSize: 10,
            roleQuotas: [
                { role: "new", targetCount: 5 },
                { role: "comfort-food", targetCount: 2 },
                { role: "classic", targetCount: 2 },
                { role: "growing", targetCount: 1 },
            ],
            random: () => .5,
        })

        expect(plan.items).toHaveLength(10)
        expect(plan.items.filter(item => item.reason === "fill")).toHaveLength(6)
        expect(plan.items.every(item => item.role === "new" || item.role === "classic")).toBe(true)
    })

    it("deprioritizes the previous Rotation when equivalent alternatives exist", () => {
        const albums = Array.from({ length: 4 }, (_, index) => makeAlbum({
            id: `album-${index}`,
            category: "new",
            listenCount: 0,
            lastListened: null,
        }))
        const plan = generateRotationPlan(albums, {
            targetSize: 2,
            roleQuotas: [{ role: "new", targetCount: 2 }],
            previousAlbumIds: ["album-0", "album-1"],
            random: () => .5,
        })

        expect(plan.albumIds.sort()).toEqual(["album-2", "album-3"])
    })

    it("can produce different selections from the same eligible pool", () => {
        const albums = Array.from({ length: 6 }, (_, index) => makeAlbum({
            id: `album-${index}`,
            category: "new",
        }))
        const valuesA = [.95, .85, .75, .25, .15, .05]
        const valuesB = [...valuesA].reverse()
        const first = generateRotationPlan(albums, {
            targetSize: 3,
            roleQuotas: [{ role: "new", targetCount: 3 }],
            random: () => valuesA.shift() ?? .5,
        })
        const second = generateRotationPlan(albums, {
            targetSize: 3,
            roleQuotas: [{ role: "new", targetCount: 3 }],
            random: () => valuesB.shift() ?? .5,
        })

        expect(first.albumIds).not.toEqual(second.albumIds)
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
