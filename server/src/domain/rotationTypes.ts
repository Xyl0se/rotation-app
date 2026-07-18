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
    exports?: RotationExportSummary[]
}
export interface RotationExportSummary { id: string; appliedAt: string; totalSizeBytes: number | null; fileCount: number | null }
export type JournalMood = "calm" | "energized" | "melancholic" | "curious" | "nostalgic"
export type JournalContext = "focused" | "background" | "on-the-go" | "evening" | "shared"
export interface ListeningJournalEntry {
    note: string
    moodTags: JournalMood[]
    contextTags: JournalContext[]
    createdAt: string
    updatedAt: string
}
export interface ListenEvent { id: string; albumId: string; listenedAt: string; journal?: ListeningJournalEntry }
export interface RotationSettings {
    targetSize: number
    roleQuotas: RotationRoleQuota[]
}
