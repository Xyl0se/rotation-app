import type { Album } from "../../types/album"

import type { RoleId } from "../roles"

import type {
    RotationPlanItem,
} from "../rotation-plan/rotationPlan"

import type { ListenEvent } from "../listening/listenEvents"

import type { RotationExplanation } from "./explanationSources"

function daysBetween(
    start: string,
    end: Date,
): number {
    const startTime =
        new Date(start).getTime()

    if (Number.isNaN(startTime)) {
        return 0
    }

    const millisecondsPerDay =
        1000 * 60 * 60 * 24

    return Math.floor(
        (end.getTime() - startTime) / millisecondsPerDay,
    )
}

function getAlbumListenEvents(
    album: Album,
    listenEvents: ListenEvent[],
): ListenEvent[] {
    return listenEvents
        .filter(event => event.albumId === album.id)
        .sort(
            (a, b) =>
                new Date(b.listenedAt).getTime() -
                new Date(a.listenedAt).getTime(),
        )
}

function getListenCount(
    album: Album,
    listenEvents: ListenEvent[],
): number {
    if (listenEvents.length > 0) {
        return getAlbumListenEvents(album, listenEvents).length
    }

    return album.listenCount
}

function getLastListenedDate(
    album: Album,
    listenEvents: ListenEvent[],
): string | null {
    if (listenEvents.length > 0) {
        const events = getAlbumListenEvents(album, listenEvents)
        return events[0]?.listenedAt ?? null
    }

    return album.lastListened
}

function getRoleSince(album: Album): string | undefined {
    const entry = album.roleHistory.at(-1)
    return entry?.recordedAt
}

function getRoleDays(
    album: Album,
    now: Date,
): number | undefined {
    const since = getRoleSince(album)
    if (!since) {
        return undefined
    }
    return daysBetween(since, now)
}

function getDaysSinceLastListen(
    album: Album,
    listenEvents: ListenEvent[],
    now: Date,
): number | undefined {
    const last = getLastListenedDate(album, listenEvents)
    if (!last) {
        return undefined
    }
    return daysBetween(last, now)
}

function roleExplanation(
    role: RoleId,
): RotationExplanation | null {
    switch (role) {
        case "new":
            return {
                text: "This album is new in your collection and waiting to be discovered.",
                source: "role",
            }
        case "growing":
            return {
                text: "This album grows a little more with every listen.",
                source: "role",
            }
        case "comfort-food":
            return {
                text: "This album brings familiarity to the current selection.",
                source: "role",
            }
        case "classic":
            return {
                text: "This album has accompanied you for a long time and forms a calm center.",
                source: "role",
            }
        case "admire":
            return {
                text: "This album is highly valued by you — even if you don't reach for it often.",
                source: "role",
            }
        default:
            return null
    }
}

function listenHistoryExplanation(
    album: Album,
    listenEvents: ListenEvent[],
    now: Date,
): RotationExplanation | null {
    const count = getListenCount(album, listenEvents)
    const daysSince = getDaysSinceLastListen(album, listenEvents, now)

    if (count === 0) {
        return {
            text: "It's waiting for its first listen session.",
            source: "listen-history",
        }
    }

    if (daysSince !== undefined && daysSince > 60) {
        return {
            text: "It hasn't been listened to in a while.",
            source: "listen-history",
        }
    }

    if (count >= 5 && (daysSince === undefined || daysSince <= 14)) {
        return {
            text: "You've listened to it a lot recently.",
            source: "listen-history",
        }
    }

    return null
}

function roleHistoryExplanation(
    album: Album,
    now: Date,
): RotationExplanation | null {
    const roleDays = getRoleDays(album, now)

    if (roleDays !== undefined && roleDays < 14) {
        return {
            text: "It's only recently become part of this role.",
            source: "role-history",
        }
    }

    if (roleDays !== undefined && roleDays > 180) {
        return {
            text: "It has belonged to this role for a long time.",
            source: "role-history",
        }
    }

    return null
}

function planReasonExplanation(
    item: RotationPlanItem,
): RotationExplanation | null {
    if (item.reason === "fill") {
        return {
            text: "It complements the current selection.",
            source: "plan-reason",
        }
    }

    return null
}

function storyExplanation(
    album: Album,
): RotationExplanation | null {
    const story = album.story
    if (!story) {
        return null
    }

    if (story.acquiredBecause === "friend-recommendation") {
        return {
            text: "It originally came into your collection through a recommendation.",
            source: "story",
        }
    }

    if (story.acquiredBecause === "concert") {
        return {
            text: "It's connected to a concert.",
            source: "story",
        }
    }

    if (story.acquiredBecause === "gift") {
        return {
            text: "It's a gift that remained in your collection.",
            source: "story",
        }
    }

    if (story.lifePhase && story.lifePhase !== "unknown") {
        return {
            text: "It's connected to a specific life phase.",
            source: "story",
        }
    }

    if (story.memoryNote) {
        return {
            text: "A personal memory is attached to it.",
            source: "story",
        }
    }

    return null
}

/**
 * Explains why a single album is part of the current player rotation.
 *
 * The explanation is based exclusively on the concrete rotation.
 * Not on library size, not on role limits, not on optimization.
 */
export function explainRotationItem(
    album: Album,
    item: RotationPlanItem,
    listenEvents: ListenEvent[],
    now = new Date(),
): RotationExplanation {
    const candidates: RotationExplanation[] = []

    const listenExp = listenHistoryExplanation(album, listenEvents, now)
    if (listenExp) {
        candidates.push(listenExp)
    }

    const roleHistExp = roleHistoryExplanation(album, now)
    if (roleHistExp) {
        candidates.push(roleHistExp)
    }

    const roleExp = roleExplanation(item.role)
    if (roleExp) {
        candidates.push(roleExp)
    }

    const storyExp = storyExplanation(album)
    if (storyExp) {
        candidates.push(storyExp)
    }

    const planExp = planReasonExplanation(item)
    if (planExp) {
        candidates.push(planExp)
    }

    if (candidates.length === 0) {
        return {
            text: "This album is part of your current selection.",
            source: "role",
        }
    }

    return candidates[0]
}
