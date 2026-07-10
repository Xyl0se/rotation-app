import { describe, expect, it, beforeEach } from "vitest"
import { createMemoryStorageAdapter } from "../adapters/memoryStorageAdapter"
import { createRotationPlanRepository } from "./rotationPlanRepository"
import { STORAGE } from "../config/storage"
import type { RotationPlan } from "../domain/rotation-plan/rotationPlan"

function makePlan(partial: Partial<RotationPlan> = {}): RotationPlan {
    return {
        id: "plan-1",
        name: "Test Plan",
        targetSize: 10,
        albumIds: [],
        items: [],
        roleQuotas: [],
        createdAt: "2024-01-01",
        status: "draft",
        ...partial,
    }
}

describe("rotationPlanRepository", () => {
    let adapter = createMemoryStorageAdapter()

    beforeEach(() => {
        adapter = createMemoryStorageAdapter()
    })

    it("returns null when no draft", () => {
        const repo = createRotationPlanRepository(adapter)
        expect(repo.loadDraft()).toBeNull()
    })

    it("loads draft plan", () => {
        const plan = makePlan()
        adapter.set(STORAGE.CURRENT_ROTATION_PLAN, JSON.stringify(plan))
        const repo = createRotationPlanRepository(adapter)
        expect(repo.loadDraft()).toEqual(plan)
    })

    it("loads active plan", () => {
        const plan = makePlan({ status: "active" })
        adapter.set(STORAGE.ACTIVE_ROTATION_PLAN, JSON.stringify(plan))
        const repo = createRotationPlanRepository(adapter)
        expect(repo.loadActive()).toEqual(plan)
    })

    it("returns null for malformed plan data", () => {
        adapter.set(
            STORAGE.CURRENT_ROTATION_PLAN,
            JSON.stringify({ id: "bad", name: "Bad Plan" }),
        )
        const repo = createRotationPlanRepository(adapter)
        expect(repo.loadDraft()).toBeNull()
    })

    it("returns null when JSON is not an object", () => {
        adapter.set(STORAGE.CURRENT_ROTATION_PLAN, JSON.stringify([1, 2, 3]))
        const repo = createRotationPlanRepository(adapter)
        expect(repo.loadDraft()).toBeNull()
    })

    it("returns null when plan items contain invalid albumId", () => {
        const plan = makePlan({
            items: [
                { albumId: "valid", role: "new", reason: "quota" },
                { albumId: null, role: "classic", reason: "fill" } as unknown as import("../domain/rotation-plan/rotationPlan").RotationPlanItem,
            ],
        })
        adapter.set(STORAGE.CURRENT_ROTATION_PLAN, JSON.stringify(plan))
        const repo = createRotationPlanRepository(adapter)
        expect(repo.loadDraft()).toBeNull()
    })

    it("returns null when albumIds contains non-strings", () => {
        const plan = makePlan({ albumIds: ["a1", 123, "a3"] as unknown as string[] })
        adapter.set(STORAGE.CURRENT_ROTATION_PLAN, JSON.stringify(plan))
        const repo = createRotationPlanRepository(adapter)
        expect(repo.loadDraft()).toBeNull()
    })

    it("returns null when roleQuotas contains invalid role", () => {
        const plan = makePlan({
            roleQuotas: [
                { role: "new", targetCount: 5 },
                { role: "unknown", targetCount: 3 } as unknown as import("../domain/rotation-plan/rotationPlan").RotationRoleQuota,
            ],
        })
        adapter.set(STORAGE.CURRENT_ROTATION_PLAN, JSON.stringify(plan))
        const repo = createRotationPlanRepository(adapter)
        expect(repo.loadDraft()).toBeNull()
    })

    it("returns null for draft with invalid status", () => {
        const plan = makePlan({ status: "active" })
        adapter.set(STORAGE.CURRENT_ROTATION_PLAN, JSON.stringify(plan))
        const repo = createRotationPlanRepository(adapter)
        expect(repo.loadDraft()).toBeNull()
    })

    it("returns null for active with invalid status", () => {
        const plan = makePlan({ status: "draft" })
        adapter.set(STORAGE.ACTIVE_ROTATION_PLAN, JSON.stringify(plan))
        const repo = createRotationPlanRepository(adapter)
        expect(repo.loadActive()).toBeNull()
    })

    it("saves draft plan", () => {
        const repo = createRotationPlanRepository(adapter)
        const plan = makePlan()
        repo.saveDraft(plan)
        expect(adapter.get(STORAGE.CURRENT_ROTATION_PLAN)).toBe(JSON.stringify(plan))
    })

    it("saves active plan", () => {
        const repo = createRotationPlanRepository(adapter)
        const plan = makePlan({ status: "active" })
        repo.saveActive(plan)
        expect(adapter.get(STORAGE.ACTIVE_ROTATION_PLAN)).toBe(JSON.stringify(plan))
    })

    it("clears draft", () => {
        adapter.set(STORAGE.CURRENT_ROTATION_PLAN, "{}")
        const repo = createRotationPlanRepository(adapter)
        repo.clearDraft()
        expect(adapter.get(STORAGE.CURRENT_ROTATION_PLAN)).toBeNull()
    })

    it("clears active", () => {
        adapter.set(STORAGE.ACTIVE_ROTATION_PLAN, "{}")
        const repo = createRotationPlanRepository(adapter)
        repo.clearActive()
        expect(adapter.get(STORAGE.ACTIVE_ROTATION_PLAN)).toBeNull()
    })

    it("clears both", () => {
        adapter.set(STORAGE.CURRENT_ROTATION_PLAN, "{}")
        adapter.set(STORAGE.ACTIVE_ROTATION_PLAN, "{}")
        const repo = createRotationPlanRepository(adapter)
        repo.clear()
        expect(adapter.get(STORAGE.CURRENT_ROTATION_PLAN)).toBeNull()
        expect(adapter.get(STORAGE.ACTIVE_ROTATION_PLAN)).toBeNull()
    })
})
