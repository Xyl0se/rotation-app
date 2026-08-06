/**
 * Client-side Rotation Plan type definitions.
 * Mirrors the shared domain model plus client-specific display fields.
 */

export type RotationEligibleRole =
    | "new"
    | "growing"
    | "comfort-food"
    | "classic"

export type RotationPlanReason = "quota" | "fill"

export interface RotationRoleQuota {
    role: RotationEligibleRole
    targetCount: number
}

export interface RotationPlanItem {
    albumId: string
    role: RotationEligibleRole
    reason: RotationPlanReason
    albumTitleSnapshot?: string
    albumArtistSnapshot?: string
}

export type RotationPlanStatus = "draft" | "active" | "archived"

export interface RotationPlan {
    id: string
    name: string
    targetSize: number
    albumIds: string[]
    items: RotationPlanItem[]
    roleQuotas: RotationRoleQuota[]
    createdAt: string
    status: RotationPlanStatus
    acceptedAt?: string
    archivedAt?: string
    exports?: Array<{
        id: string
        appliedAt: string
        totalSizeBytes: number | null
        fileCount: number | null
    }>
}

export const defaultRotationTargetSize = 25

export const defaultRotationRoleQuotas: RotationRoleQuota[] = [
    { role: "new", targetCount: 10 },
    { role: "comfort-food", targetCount: 5 },
    { role: "classic", targetCount: 5 },
    { role: "growing", targetCount: 5 },
]