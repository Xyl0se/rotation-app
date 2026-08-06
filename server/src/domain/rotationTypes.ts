/**
 * Server-side Rotation Plan type definitions.
 * Mirrors the shared domain model plus persistence-specific fields.
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
    focusAlbumId: string | null
    generationSource?: "manual" | "automation"
    automationExecutionKey?: string | null
    acceptedAt?: string
    archivedAt?: string
    exports?: Array<{
        id: string
        appliedAt: string
        totalSizeBytes: number | null
        fileCount: number | null
    }>
}

export interface RotationSettings {
    targetSize: number
    roleQuotas: RotationRoleQuota[]
}

export interface RotationExportSummary {
    id: string
    appliedAt: string
    totalSizeBytes: number | null
    fileCount: number | null
}

export type JournalMood = "calm" | "energized" | "melancholic" | "curious" | "nostalgic"

export type JournalContext = "focused" | "background" | "on-the-go" | "evening" | "shared"

export interface ListeningJournalEntry {
    note: string
    moodTags: JournalMood[]
    contextTags: JournalContext[]
    createdAt: string
    updatedAt: string
}

export interface ListenEvent {
    id: string
    albumId: string
    listenedAt: string
    journal?: ListeningJournalEntry
}

export const defaultRotationTargetSize = 25

export const defaultRotationRoleQuotas: RotationRoleQuota[] = [
    { role: "new", targetCount: 10 },
    { role: "comfort-food", targetCount: 5 },
    { role: "classic", targetCount: 5 },
    { role: "growing", targetCount: 5 },
]