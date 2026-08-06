/**
 * The only fields that generateRotationPlan and findReplacement actually read.
 */
export interface RotationCandidate {
    id: string
    title: string
    category: RotationEligibleRole
    listenCount: number
    lastListened: string | null
}

export type RotationEligibleRole =
    | "new"
    | "growing"
    | "comfort-food"
    | "classic"

export type RotationPlanReason =
    | "quota"
    | "fill"

export interface RotationRoleQuota {
    role: RotationEligibleRole
    targetCount: number
}

export interface RotationPlanItem {
    albumId: string
    role: RotationEligibleRole
    reason: RotationPlanReason
}

export type RotationPlanStatus =
    | "draft"
    | "active"
    | "archived"

/**
 * Pure algorithm output. No persistence metadata.
 */
export interface RotationPlan {
    id: string
    name: string
    targetSize: number
    albumIds: string[]
    items: RotationPlanItem[]
    roleQuotas: RotationRoleQuota[]
    createdAt: string
    status: RotationPlanStatus
}