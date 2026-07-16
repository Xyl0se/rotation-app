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

}

export type RotationPlanStatus =
    | "draft"
    | "active"

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

}

export const defaultRotationTargetSize = 30

export const defaultRotationRoleQuotas: RotationRoleQuota[] = [

    {
        role: "new",
        targetCount: 10,
    },

    {
        role: "comfort-food",
        targetCount: 8,
    },

    {
        role: "growing",
        targetCount: 12,
    },

]
