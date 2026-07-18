import type { Album, AlbumAcquisitionReason } from "../../types/album"

import type { RoleId } from "../roles"

import { roles } from "../roles"

import type { ListenEvent } from "../listening/listenEvents"

export type AlbumTimelineEventType =
    | "role-assigned"
    | "listened"
    | "story-added"

export interface AlbumTimelineEvent {
    id: string
    type: AlbumTimelineEventType
    date: string
    title: string
    description: string
    role?: RoleId
    roleAtTime?: RoleId
    journal?: ListenEvent["journal"]
}

function getRoleTitle(role: RoleId): string {
    return roles.find(item => item.id === role)?.title ?? role
}

function getSourceLabel(source: string): string {
    switch (source) {
        case "coach":
            return "Album Coach"
        case "reflection":
            return "Reflection"
        case "archive":
            return "Archive Workflow"
        default:
            return "Rotation"
    }
}

function formatListenTitle(
    index: number,
    total: number,
): string {
    if (total === 1) {
        return "First Listen Session"
    }

    if (index === 0) {
        return "Last Listen Session"
    }

    return `Listen Session ${total - index}`
}

function createListenEvents(
    album: Album,
    listenEvents: ListenEvent[],
): AlbumTimelineEvent[] {
    const albumEvents =
        listenEvents
            .filter(event => event.albumId === album.id)
            .sort(
                (a, b) =>
                    new Date(b.listenedAt).getTime() -
                    new Date(a.listenedAt).getTime()
            )

    const total = albumEvents.length

    if (total === 0 && album.lastListened) {
        return [
            {
                id: `legacy-${album.lastListened}`,
                type: "listened" as const,
                date: album.lastListened,
                title: "Last Listened",
                description:
                    album.listenCount === 1
                        ? "The first documented listen session."
                        : `${album.listenCount} documented listen sessions in total.`,
            },
        ]
    }

    return albumEvents.map((event, index) => ({
        id: event.id,
        type: "listened" as const,
        date: event.listenedAt,
        title: formatListenTitle(index, total),
        description:
            index === 0
                ? `Most recent documented session (${total} in total).`
                : `Session ${total - index} of ${total}.`,
        roleAtTime:[...album.roleHistory].filter(entry=>new Date(entry.recordedAt).getTime()<=new Date(event.listenedAt).getTime()).sort((a,b)=>new Date(b.recordedAt).getTime()-new Date(a.recordedAt).getTime())[0]?.role,
        journal:event.journal,
    }))
}

export function createAlbumTimeline(
    album: Album,
    listenEvents: ListenEvent[],
): AlbumTimelineEvent[] {
    const roleEvents =
        album.roleHistory.map((entry, index) => ({
            id: `role-${entry.recordedAt}-${index}`,
            type: "role-assigned" as const,
            date: entry.recordedAt,
            title: getRoleTitle(entry.role),
            description:
                `Assigned via ${getSourceLabel(entry.source)}.`,
            role: entry.role,
        }))

    const listenTimelineEvents =
        createListenEvents(album, listenEvents)

    const storyEvent: AlbumTimelineEvent[] =
        album.story
            ? [
                {
                    id: `story-${album.story.createdAt}`,
                    type: "story-added" as const,
                    date: album.story.createdAt,
                    title: "Story added",
                    description:
                        album.story.acquiredBecause
                            ? `Acquired because: ${getAcquisitionLabel(album.story.acquiredBecause)}`
                            : "A personal story was linked.",
                },
            ]
            : []

    function getAcquisitionLabel(
        reason: AlbumAcquisitionReason | undefined,
    ): string {
        switch (reason) {
            case "artist":
                return "I like the artist"
            case "friend-recommendation":
                return "Recommendation"
            case "specific-song":
                return "A specific song"
            case "concert":
                return "Concert"
            case "review":
                return "Review"
            case "record-store":
                return "Record Store"
            case "gift":
                return "Gift"
            case "random-discovery":
                return "Randomly discovered"
            case "life-phase":
                return "Life phase"
            case "other":
                return "Other reason"
            default:
                return reason ?? ""
        }
    }

    return [
        ...roleEvents,
        ...listenTimelineEvents,
        ...storyEvent,
    ].sort((first, second) =>
        new Date(second.date).getTime() -
        new Date(first.date).getTime()
    )
}
