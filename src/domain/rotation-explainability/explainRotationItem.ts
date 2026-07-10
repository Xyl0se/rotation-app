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
                text: "Dieses Album ist neu in deiner Sammlung und wartet darauf, entdeckt zu werden.",
                source: "role",
            }
        case "growing":
            return {
                text: "Dieses Album wächst mit jedem Hören ein Stück mehr.",
                source: "role",
            }
        case "comfort-food":
            return {
                text: "Dieses Album bringt Vertrautheit in die aktuelle Auswahl.",
                source: "role",
            }
        case "classic":
            return {
                text: "Dieses Album begleitet dich schon lange und bildet einen ruhigen Mittelpunkt.",
                source: "role",
            }
        case "admire":
            return {
                text: "Dieses Album schätzt du – auch wenn du nicht oft dazu greifst.",
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
            text: "Es wartet auf seine erste Hörsession.",
            source: "listen-history",
        }
    }

    if (daysSince !== undefined && daysSince > 60) {
        return {
            text: "Es wurde schon eine Weile nicht mehr gehört.",
            source: "listen-history",
        }
    }

    if (count >= 5 && (daysSince === undefined || daysSince <= 14)) {
        return {
            text: "Du hast es in letzter Zeit oft gehört.",
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
            text: "Es ist erst seit Kurzem Teil dieser Rolle.",
            source: "role-history",
        }
    }

    if (roleDays !== undefined && roleDays > 180) {
        return {
            text: "Es gehört schon lange zu dieser Rolle.",
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
            text: "Es ergänzt die aktuelle Auswahl.",
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
            text: "Es kam ursprünglich durch eine Empfehlung in deine Sammlung.",
            source: "story",
        }
    }

    if (story.acquiredBecause === "concert") {
        return {
            text: "Es ist mit einem Konzert verbunden.",
            source: "story",
        }
    }

    if (story.acquiredBecause === "gift") {
        return {
            text: "Es ist ein Geschenk, das in deiner Sammlung geblieben ist.",
            source: "story",
        }
    }

    if (story.lifePhase) {
        return {
            text: "Es ist mit einer bestimmten Lebensphase verbunden.",
            source: "story",
        }
    }

    if (story.memoryNote) {
        return {
            text: "Eine persönliche Erinnerung gehört dazu.",
            source: "story",
        }
    }

    return null
}

/**
 * Erklärt, warum ein einzelnes Album Teil der aktuellen Player-Rotation ist.
 *
 * Die Erklärung basiert ausschließlich auf der konkreten Rotation.
 * Nicht auf Bibliotheksgröße, nicht auf Rollenlimits, nicht auf Optimierung.
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
            text: "Dieses Album ist Teil deiner aktuellen Auswahl.",
            source: "role",
        }
    }

    return candidates[0]
}
