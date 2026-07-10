import { describe, expect, it } from "vitest"
import { makeAlbum } from "../__tests__/factory"
import { findReplacementCandidates } from "./findReplacement"
import type { RotationPlan, RotationPlanItem } from "./rotationPlan"

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
        const albums = [
            makeAlbum({ id: "c1", category: "new", listenCount: 0 }),
            makeAlbum({ id: "c2", category: "new", listenCount: 1 }),
            makeAlbum({ id: "c3", category: "comfort-food", listenCount: 0 }),
        ]
        const candidates = findReplacementCandidates(removedItem, plan, albums, 3)
        expect(candidates).toHaveLength(2)
        expect(candidates.map(c => c.id)).toEqual(["c1", "c2"])
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
        const albums = [
            makeAlbum({ id: "selected", category: "new" }),
            makeAlbum({ id: "c1", category: "new", listenCount: 0 }),
        ]
        const candidates = findReplacementCandidates(removedItem, plan, albums, 3)
        expect(candidates.map(c => c.id)).toEqual(["c1"])
    })

    it("excludes the removed album itself", () => {
        const removedItem: RotationPlanItem = {
            albumId: "removed",
            role: "new",
            reason: "quota",
        }
        const plan = makePlan([removedItem])
        const albums = [
            makeAlbum({ id: "removed", category: "new" }),
        ]
        const candidates = findReplacementCandidates(removedItem, plan, albums, 3)
        expect(candidates).toHaveLength(0)
    })

    it("excludes archive albums", () => {
        const removedItem: RotationPlanItem = {
            albumId: "removed",
            role: "new",
            reason: "quota",
        }
        const plan = makePlan([removedItem])
        const albums = [
            makeAlbum({ id: "c1", category: "archive" }),
        ]
        const candidates = findReplacementCandidates(removedItem, plan, albums, 3)
        expect(candidates).toHaveLength(0)
    })

    it("returns at most 'limit' candidates", () => {
        const removedItem: RotationPlanItem = {
            albumId: "removed",
            role: "new",
            reason: "quota",
        }
        const plan = makePlan([removedItem])
        const albums = Array.from({ length: 10 }, (_, i) =>
            makeAlbum({ id: `c${i}`, category: "new", listenCount: i })
        )
        const candidates = findReplacementCandidates(removedItem, plan, albums, 3)
        expect(candidates).toHaveLength(3)
    })

    it("sorts by lower listenCount first", () => {
        const removedItem: RotationPlanItem = {
            albumId: "removed",
            role: "new",
            reason: "quota",
        }
        const plan = makePlan([removedItem])
        const albums = [
            makeAlbum({ id: "c1", category: "new", listenCount: 5 }),
            makeAlbum({ id: "c2", category: "new", listenCount: 1 }),
            makeAlbum({ id: "c3", category: "new", listenCount: 0 }),
        ]
        const candidates = findReplacementCandidates(removedItem, plan, albums, 3)
        expect(candidates.map(c => c.id)).toEqual(["c3", "c2", "c1"])
    })
})
