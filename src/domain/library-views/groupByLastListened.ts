import type { Album } from "../../types/album"

import type { ListenEvent } from "../listening/listenEvents"

import type { LibraryGroup } from "./libraryGroup"

import {
    categorizeRecency,
    recencyGroups,
} from "./categorizeRecency"

/**
 * Groups albums by the last listen session.
 *
 * Source of truth:
 * 1. listenEvents (most recent event per album)
 * 2. Fallback: album.lastListened
 *
 * Groups: Today → This Week → This Month → This Year → Longer ago → Not yet listened
 */
export function groupByLastListened(
    albums: Album[],
    listenEvents: ListenEvent[],
    now = new Date(),
): LibraryGroup[] {
    // Index: albumId → most recent listenedAt
    const eventMap = new Map<string, string>()

    for (const event of listenEvents) {
        const existing = eventMap.get(event.albumId)

        if (!existing || event.listenedAt > existing) {
            eventMap.set(event.albumId, event.listenedAt)
        }
    }

    const categorized = new Map<string, Album[]>()

    for (const album of albums) {
        const listenedAt = eventMap.get(album.id) ?? album.lastListened
        const category = categorizeRecency(listenedAt, now)

        const existing = categorized.get(category)

        if (existing) {
            existing.push(album)
        } else {
            categorized.set(category, [album])
        }
    }

    // Fixed order via recencyGroups
    return recencyGroups
        .filter(group => categorized.has(group.key))
        .map(group => {
            const groupAlbums = categorized.get(group.key)!

            // Within the group: most recent listen session first
            groupAlbums.sort((a, b) => {
                const aDate = eventMap.get(a.id) ?? a.lastListened ?? ""
                const bDate = eventMap.get(b.id) ?? b.lastListened ?? ""
                return bDate.localeCompare(aDate)
            })

            return {
                key: group.key,
                title: group.title,
                albums: groupAlbums,
            }
        })
}
