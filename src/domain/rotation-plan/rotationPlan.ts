import type { RoleId } from "../roles"

export interface RotationRoleQuota {

    role: RoleId

    targetCount: number

}

export type RotationPlanReason =
    | "quota"
    | "fill"

export interface RotationPlanItem {

    albumId: string

    role: RoleId

    reason: RotationPlanReason

    albumTitleSnapshot?: string

    albumArtistSnapshot?: string

}

export type RotationPlanStatus =
    | "draft"
    | "active"
    | "archived"

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

    exports?: Array<{ id: string; appliedAt: string; totalSizeBytes: number | null; fileCount: number | null }>

}

export const defaultRotationTargetSize = 25

export const defaultRotationRoleQuotas: RotationRoleQuota[] = [

    {
        role: "new",
        targetCount: 10,
    },

    {
        role: "comfort-food",
        targetCount: 5,
    },

    {
        role: "classic",
        targetCount: 5,
    },

    {
        role: "growing",
        targetCount: 5,
    },

]
