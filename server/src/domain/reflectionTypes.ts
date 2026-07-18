export type ReflectionRuleCode =
    | "new-after-listens"
    | "growing-for-a-while"
    | "comfort-not-recent"
    | "archive-return-candidate"
    | "never-heard-dormant"
    | "rotation-absent-dormant"

export type ReflectionInboxState = "open" | "snoozed" | "resolved" | "dismissed"
export type ArchiveTemperature = "warm" | "cold"

export interface ReflectionEvidence {
    role: string
    listenCount: number
    lastListened: string | null
    roleSince: string | null
    daysInRole: number | null
    daysSinceListen: number | null
    recentRotationCount: number
    recentJournalEventIds?: string[]
    archiveTemperature?: ArchiveTemperature
}

export interface ReflectionInboxItem {
    id: string
    albumId: string
    albumTitle: string
    albumArtist: string
    albumCoverUrl?: string
    ruleCode: ReflectionRuleCode
    state: ReflectionInboxState
    evidence: ReflectionEvidence
    createdAt: string
    dueAt: string
    snoozedUntil: string | null
    resolvedAt: string | null
    resolution: string | null
}
