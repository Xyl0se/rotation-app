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
            return "Archiv Workflow"

        default:
            return "Rotation"

    }

}

function formatListenTitle(
    index: number,
    total: number,
): string {

    if (total === 1) {

        return "Erste Hörsession"

    }

    if (index === 0) {

        return "Letzte Hörsession"

    }

    return `Hörsession ${total - index}`

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

                title: "Zuletzt gehört",

                description:
                    album.listenCount === 1
                        ? "Die erste dokumentierte Hörsession."
                        : `${album.listenCount} dokumentierte Hörsessions insgesamt.`,

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
                ? `Höchstens dokumentierte Session (${total} insgesamt).`
                : `Session ${total - index} von ${total}.`,

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

            title:
                getRoleTitle(entry.role),

            description:
                `Eingeordnet durch ${getSourceLabel(entry.source)}.`,

            role:
                entry.role,

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
                    title: "Geschichte hinzugefügt",
                    description:
                        album.story.acquiredBecause
                            ? `Erworben wegen: ${getAcquisitionLabel(album.story.acquiredBecause)}`
                            : "Eine persönliche Geschichte wurde verknüpft.",
                },
            ]
            : []

    function getAcquisitionLabel(
        reason: AlbumAcquisitionReason | undefined,
    ): string {
        switch (reason) {
            case "artist":
                return "Ich mag den Künstler"
            case "friend-recommendation":
                return "Empfehlung"
            case "specific-song":
                return "Ein bestimmter Song"
            case "concert":
                return "Konzert"
            case "review":
                return "Rezension"
            case "record-store":
                return "Plattenladen"
            case "gift":
                return "Geschenk"
            case "random-discovery":
                return "Zufällig entdeckt"
            case "life-phase":
                return "Lebensphase"
            case "other":
                return "Anderer Grund"
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
