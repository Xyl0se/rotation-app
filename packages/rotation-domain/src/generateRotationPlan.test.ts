import { describe, expect, it } from "vitest"
import { makeCandidate } from "./__tests__/factory"
import { generateRotationPlan } from "./generateRotationPlan"
import { defaultRotationTargetSize } from "./rotationPlan"

const deterministicDeps = {
    random: () => 0.5,
    generateId: () => "test-id-1",
}

describe("generateRotationPlan", () => {
    it("generates a draft plan with default target size", () => {
        const candidates = [
            makeCandidate({ id: "a1", category: "new", listenCount: 0 }),
            makeCandidate({ id: "a2", category: "comfort-food", listenCount: 1 }),
            makeCandidate({ id: "a3", category: "classic", listenCount: 2 }),
        ]
        const plan = generateRotationPlan(candidates, {}, deterministicDeps)
        expect(plan.status).toBe("draft")
        expect(plan.targetSize).toBe(defaultRotationTargetSize)
        expect(plan.items).toHaveLength(3)
    })

    it("excludes archive albums", () => {
        const candidates = [
            makeCandidate({ id: "a1", category: "new" }),
            makeCandidate({ id: "a2", category: "archive" as "new" }),
        ]
        const plan = generateRotationPlan(candidates, {}, deterministicDeps)
        expect(plan.items.some(item => item.albumId === "a2")).toBe(false)
    })

    it("excludes candidates without a category", () => {
        const candidates = [
            makeCandidate({ id: "a1", category: "new" }),
            { ...makeCandidate({ id: "a2" }), category: undefined as unknown as "new" },
        ]
        const plan = generateRotationPlan(candidates, {}, deterministicDeps)
        expect(plan.items.some(item => item.albumId === "a2")).toBe(false)
    })

    it("fills according to role quotas", () => {
        const candidates = [
            makeCandidate({ id: "n1", category: "new", listenCount: 0 }),
            makeCandidate({ id: "n2", category: "new", listenCount: 1 }),
            makeCandidate({ id: "n3", category: "new", listenCount: 2 }),
            makeCandidate({ id: "c1", category: "comfort-food", listenCount: 0 }),
            makeCandidate({ id: "c2", category: "comfort-food", listenCount: 1 }),
            makeCandidate({ id: "cl1", category: "classic", listenCount: 0 }),
            makeCandidate({ id: "g1", category: "growing", listenCount: 0 }),
            makeCandidate({ id: "a1", category: "archive" as "new", listenCount: 0 }),
        ]
        const plan = generateRotationPlan(candidates, {}, deterministicDeps)
        const newItems = plan.items.filter(item => item.role === "new")
        const comfortItems = plan.items.filter(item => item.role === "comfort-food")
        const classicItems = plan.items.filter(item => item.role === "classic")
        expect(newItems.length).toBeGreaterThanOrEqual(2)
        expect(comfortItems.length).toBeGreaterThanOrEqual(2)
        expect(classicItems).toHaveLength(1)
        expect(plan.items.some(item => item.role === "archive" as "new")).toBe(false)
    })

    it("prefers candidates with lower listenCount", () => {
        const candidates = [
            makeCandidate({ id: "a1", category: "new", listenCount: 5 }),
            makeCandidate({ id: "a2", category: "new", listenCount: 1 }),
            makeCandidate({ id: "a3", category: "new", listenCount: 0 }),
        ]
        const plan = generateRotationPlan(candidates, {}, deterministicDeps)
        const firstItem = plan.items[0]
        expect(firstItem.albumId).toBe("a3")
    })

    it("fills quota gaps from other eligible roles up to the target size", () => {
        const candidates = [
            ...Array.from({ length: 2 }, (_, index) => makeCandidate({ id: `new-${index}`, category: "new" })),
            ...Array.from({ length: 8 }, (_, index) => makeCandidate({ id: `classic-${index}`, category: "classic" })),
        ]
        const plan = generateRotationPlan(candidates, {
            targetSize: 10,
            roleQuotas: [
                { role: "new", targetCount: 5 },
                { role: "comfort-food", targetCount: 2 },
                { role: "classic", targetCount: 2 },
                { role: "growing", targetCount: 1 },
            ],
        }, deterministicDeps)

        expect(plan.items).toHaveLength(10)
        expect(plan.items.filter(item => item.reason === "fill")).toHaveLength(6)
        expect(plan.items.every(item => item.role === "new" || item.role === "classic")).toBe(true)
    })

    it("deprioritizes the previous Rotation when equivalent alternatives exist", () => {
        const candidates = Array.from({ length: 4 }, (_, index) => makeCandidate({
            id: `candidate-${index}`,
            category: "new",
            listenCount: 0,
            lastListened: null,
        }))
        const plan = generateRotationPlan(candidates, {
            targetSize: 2,
            roleQuotas: [{ role: "new", targetCount: 2 }],
            previousAlbumIds: ["candidate-0", "candidate-1"],
        }, deterministicDeps)

        expect(plan.albumIds.sort()).toEqual(["candidate-2", "candidate-3"])
    })

    it("can produce different selections from the same eligible pool", () => {
        const candidates = Array.from({ length: 6 }, (_, index) => makeCandidate({
            id: `candidate-${index}`,
            category: "new",
        }))
        const valuesA = [.95, .85, .75, .25, .15, .05]
        const valuesB = [...valuesA].reverse()
        const first = generateRotationPlan(candidates, {
            targetSize: 3,
            roleQuotas: [{ role: "new", targetCount: 3 }],
        }, {
            random: () => valuesA.shift() ?? .5,
            generateId: () => "id-a",
        })
        const second = generateRotationPlan(candidates, {
            targetSize: 3,
            roleQuotas: [{ role: "new", targetCount: 3 }],
        }, {
            random: () => valuesB.shift() ?? .5,
            generateId: () => "id-b",
        })

        expect(first.albumIds).not.toEqual(second.albumIds)
    })

    it("uses custom options when provided", () => {
        const candidates = [
            makeCandidate({ id: "a1", category: "new" }),
        ]
        const plan = generateRotationPlan(candidates, {
            name: "My Rotation",
            targetSize: 5,
        }, deterministicDeps)
        expect(plan.name).toBe("My Rotation")
        expect(plan.targetSize).toBe(5)
    })

    it("caps the default mix at 10 New and 5 per other eligible role", () => {
        const roles: Array<"new" | "comfort-food" | "classic" | "growing"> = ["new", "comfort-food", "classic", "growing"]
        const candidates = roles.flatMap(role => Array.from({ length: 20 }, (_, i) =>
            makeCandidate({ id: `${role}-${i}`, category: role, listenCount: i })
        ))
        const plan = generateRotationPlan(candidates, {}, deterministicDeps)
        expect(plan.items).toHaveLength(25)
        expect(plan.items.filter(item => item.role === "new")).toHaveLength(10)
        for (const role of roles.slice(1)) {
            expect(plan.items.filter(item => item.role === role)).toHaveLength(5)
        }
    })

    it("generates from a representative 10,000 Candidate Library within budget", () => {
        const roles: Array<"new" | "comfort-food" | "classic" | "growing"> = ["new", "comfort-food", "classic", "growing"]
        const candidates = Array.from({ length: 10_000 }, (_, index) => makeCandidate({
            id: `performance-${index}`,
            category: roles[index % roles.length],
            listenCount: index % 50,
        }))
        const started = performance.now()
        expect(generateRotationPlan(candidates, {}, deterministicDeps).items).toHaveLength(25)
        expect(performance.now() - started).toBeLessThan(500)
    })
})