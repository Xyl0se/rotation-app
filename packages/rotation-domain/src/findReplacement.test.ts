import { describe, expect, it } from "vitest"
import { makeCandidate } from "./__tests__/factory"
import { findReplacementCandidates } from "./findReplacement"
import type { RotationPlan, RotationPlanItem } from "./types"

function makePlan(items: RotationPlanItem[]): RotationPlan {
    return {
        id: "plan-1",
        name: "Test Plan",
        targetSize: 10,
        albumIds: items.map(item => item.albumId),
        items,
        roleQuotas: [],
        createdAt: "2024-01-01",
        status: "draft",
    }
}

describe("findReplacementCandidates", () => {
    it("returns candidates with the same role", () => {
        const removedItem: RotationPlanItem = {
            albumId: "removed",
            role: "new",
            reason: "quota",
        }
        const plan = makePlan([removedItem])
        const candidates = [
            makeCandidate({ id: "c1", category: "new", listenCount: 0 }),
            makeCandidate({ id: "c2", category: "new", listenCount: 1 }),
            makeCandidate({ id: "c3", category: "comfort-food", listenCount: 0 }),
        ]
        const result = findReplacementCandidates(removedItem, plan, candidates, 3)
        expect(result).toHaveLength(2)
        expect(result.map(c => c.id)).toEqual(["c1", "c2"])
    })

    it("excludes already selected albums", () => {
        const removedItem: RotationPlanItem = {
            albumId: "removed",
            role: "new",
            reason: "quota",
        }
        const plan = makePlan([
            removedItem,
            { albumId: "selected", role: "new", reason: "quota" },
        ])
        const candidates = [
            makeCandidate({ id: "selected", category: "new" }),
            makeCandidate({ id: "c1", category: "new", listenCount: 0 }),
        ]
        const result = findReplacementCandidates(removedItem, plan, candidates, 3)
        expect(result.map(c => c.id)).toEqual(["c1"])
    })

    it("excludes the removed album itself", () => {
        const removedItem: RotationPlanItem = {
            albumId: "removed",
            role: "new",
            reason: "quota",
        }
        const plan = makePlan([removedItem])
        const candidates = [
            makeCandidate({ id: "removed", category: "new" }),
        ]
        const result = findReplacementCandidates(removedItem, plan, candidates, 3)
        expect(result).toHaveLength(0)
    })

    it("excludes archive albums", () => {
        const removedItem: RotationPlanItem = {
            albumId: "removed",
            role: "new",
            reason: "quota",
        }
        const plan = makePlan([removedItem])
        const candidates = [
            makeCandidate({ id: "c1", category: "archive" as "new" }),
        ]
        const result = findReplacementCandidates(removedItem, plan, candidates, 3)
        expect(result).toHaveLength(0)
    })

    it("offers replacements for Classic but not for Admired", () => {
        const removedClassic: RotationPlanItem = { albumId: "removed", role: "classic", reason: "quota" }
        const candidates = [
            makeCandidate({ id: "classic", category: "classic" }),
            makeCandidate({ id: "admired", category: "archive" as "new" }),
        ]
        expect(findReplacementCandidates(removedClassic, makePlan([removedClassic]), candidates).map(c => c.id)).toEqual(["classic"])

        const removedAdmired: RotationPlanItem = { albumId: "removed", role: "archive" as "new", reason: "quota" }
        expect(findReplacementCandidates(removedAdmired, makePlan([removedAdmired]), candidates)).toEqual([])
    })

    it("returns at most 'limit' candidates", () => {
        const removedItem: RotationPlanItem = {
            albumId: "removed",
            role: "new",
            reason: "quota",
        }
        const plan = makePlan([removedItem])
        const candidates = Array.from({ length: 10 }, (_, i) =>
            makeCandidate({ id: `c${i}`, category: "new", listenCount: i })
        )
        const result = findReplacementCandidates(removedItem, plan, candidates, 3)
        expect(result).toHaveLength(3)
    })

    it("sorts by lower listenCount first", () => {
        const removedItem: RotationPlanItem = {
            albumId: "removed",
            role: "new",
            reason: "quota",
        }
        const plan = makePlan([removedItem])
        const candidates = [
            makeCandidate({ id: "c1", category: "new", listenCount: 5 }),
            makeCandidate({ id: "c2", category: "new", listenCount: 1 }),
            makeCandidate({ id: "c3", category: "new", listenCount: 0 }),
        ]
        const result = findReplacementCandidates(removedItem, plan, candidates, 3)
        expect(result.map(c => c.id)).toEqual(["c3", "c2", "c1"])
    })
})