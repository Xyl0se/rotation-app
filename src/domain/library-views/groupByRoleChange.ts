import type { Album } from "../../types/album"

import type { LibraryGroup } from "./libraryGroup"

import {
    categorizeRecency,
    recencyGroups,
} from "./categorizeRecency"

/**
 * Groups albums by the last role assignment (Role History).
 *
 * Uses the most recent `recordedAt` entry in `album.roleHistory`.
 * Albums without history land in "No classification yet".
 *
 * Groups: Today → This Week → This Month → This Year → Longer ago → No classification yet
 */
export function groupByRoleChange(
    albums: Album[],
    now = new Date(),
): LibraryGroup[] {
    const categorized = new Map<string, Album[]>()

    for (const album of albums) {
        const lastEntry = album.roleHistory
            .slice()
            .sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))
            .at(0)

        const category = categorizeRecency(lastEntry?.recordedAt ?? null, now)

        const existing = categorized.get(category)

        if (existing) {
            existing.push(album)
        } else {
            categorized.set(category, [album])
        }
    }

    // Fixed order via recencyGroups, with adjusted label for "never"
    return recencyGroups
        .filter(group => categorized.has(group.key))
        .map(group => {
            const groupAlbums = categorized.get(group.key)!

            // Within the group: most recent role assignment first
            groupAlbums.sort((a, b) => {
                const aDate = a.roleHistory
                    .slice()
                    .sort((x, y) => y.recordedAt.localeCompare(x.recordedAt))
                    .at(0)?.recordedAt ?? ""

                const bDate = b.roleHistory
                    .slice()
                    .sort((x, y) => y.recordedAt.localeCompare(x.recordedAt))
                    .at(0)?.recordedAt ?? ""

                return bDate.localeCompare(aDate)
            })

            return {
                key: group.key,
                title: group.key === "never"
                    ? "No classification yet"
                    : group.title,
                albums: groupAlbums,
            }
        })
}
