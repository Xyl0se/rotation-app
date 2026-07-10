import type { StorageAdapter } from "../adapters/storageAdapter"
import { STORAGE } from "../config/storage"
import type { RotationPlan, RotationPlanItem, RotationRoleQuota } from "../domain/rotation-plan/rotationPlan"
import { roles } from "../domain/roles"

export interface RotationPlanRepository {
    loadDraft(): RotationPlan | null
    loadActive(): RotationPlan | null
    saveDraft(plan: RotationPlan): void
    saveActive(plan: RotationPlan): void
    clearDraft(): void
    clearActive(): void
    clear(): void
}

function isString(value: unknown): value is string {
    return typeof value === "string" && value.length > 0
}

function isNumber(value: unknown): value is number {
    return typeof value === "number" && Number.isFinite(value)
}

function isValidRole(role: unknown): role is RotationRoleQuota["role"] {
    return isString(role) && roles.some(r => r.id === role)
}

function isValidRotationRoleQuota(
    quota: unknown,
): quota is RotationRoleQuota {
    if (typeof quota !== "object" || quota === null) {
        return false
    }
    const q = quota as Record<string, unknown>
    return isValidRole(q.role) && isNumber(q.targetCount)
}

function isValidRotationPlanItem(
    item: unknown,
): item is RotationPlanItem {
    if (typeof item !== "object" || item === null) {
        return false
    }
    const i = item as Record<string, unknown>
    return (
        isString(i.albumId) &&
        isValidRole(i.role) &&
        (i.reason === "quota" || i.reason === "fill")
    )
}

function isValidRotationPlan(raw: unknown): raw is RotationPlan {
    if (typeof raw !== "object" || raw === null) {
        return false
    }
    const r = raw as Record<string, unknown>

    if (
        !isString(r.id) ||
        !isString(r.name) ||
        !isNumber(r.targetSize) ||
        !Array.isArray(r.albumIds) ||
        !Array.isArray(r.items) ||
        !Array.isArray(r.roleQuotas) ||
        !isString(r.createdAt) ||
        (r.status !== "draft" && r.status !== "active")
    ) {
        return false
    }

    const allIdsStrings = r.albumIds.every(id => isString(id))
    const allItemsValid = r.items.every(isValidRotationPlanItem)
    const allQuotasValid = r.roleQuotas.every(isValidRotationRoleQuota)

    if (!allIdsStrings || !allItemsValid || !allQuotasValid) {
        return false
    }

    if (r.acceptedAt !== undefined && !isString(r.acceptedAt)) {
        return false
    }

    return true
}

export function createRotationPlanRepository(
    adapter: StorageAdapter,
    draftKey: string = STORAGE.CURRENT_ROTATION_PLAN,
    activeKey: string = STORAGE.ACTIVE_ROTATION_PLAN,
): RotationPlanRepository {
    return {
        loadDraft(): RotationPlan | null {
            const raw = adapter.get(draftKey)
            if (!raw) {
                return null
            }
            try {
                const parsed = JSON.parse(raw) as unknown
                if (isValidRotationPlan(parsed) && parsed.status === "draft") {
                    return parsed
                }
            } catch {
                // ignore
            }
            return null
        },
        loadActive(): RotationPlan | null {
            const raw = adapter.get(activeKey)
            if (!raw) {
                return null
            }
            try {
                const parsed = JSON.parse(raw) as unknown
                if (
                    isValidRotationPlan(parsed) &&
                    parsed.status === "active"
                ) {
                    return parsed
                }
            } catch {
                // ignore
            }
            return null
        },
        saveDraft(plan: RotationPlan): void {
            adapter.set(
                draftKey,
                JSON.stringify(plan),
            )
        },
        saveActive(plan: RotationPlan): void {
            adapter.set(
                activeKey,
                JSON.stringify(plan),
            )
        },
        clearDraft(): void {
            adapter.remove(draftKey)
        },
        clearActive(): void {
            adapter.remove(activeKey)
        },
        clear(): void {
            this.clearDraft()
            this.clearActive()
        },
    }
}
