import type { RoleId } from "./albumTypes.js"

export interface RotationRoleQuota { role: RoleId; targetCount: number }
export interface RotationPlanItem { albumId: string; role: RoleId; reason: "quota" | "fill"; albumTitleSnapshot?: string; albumArtistSnapshot?: string }
export interface RotationPlan {
    id: string
    name: string
    targetSize: number
    items: RotationPlanItem[]
    albumIds: string[]
    roleQuotas: RotationRoleQuota[]
    createdAt: string
    status: "draft" | "active" | "archived"
    acceptedAt?: string
    archivedAt?: string
    focusAlbumId: string | null
}
export interface ListenEvent { id: string; albumId: string; listenedAt: string }
export interface RotationSettings {
    targetSize: number
    roleQuotas: RotationRoleQuota[]
}
