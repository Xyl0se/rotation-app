import type { Album } from "../../types/album"

import type { LibraryGroup } from "./libraryGroup"

import {
    categorizeRecency,
    recencyGroups,
} from "./categorizeRecency"

/**
 * Gruppiert Alben nach der letzten Einordnung (Role History).
 *
 * Nutzt den neuesten `recordedAt`-Eintrag in `album.roleHistory`.
 * Alben ohne History landen in "Noch keine Einordnung".
 *
 * Gruppen: Heute → Diese Woche → Dieser Monat → Dieses Jahr → Länger her → Noch keine Einordnung
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

    // Feste Reihenfolge via recencyGroups, mit angepasstem Label für "never"
    return recencyGroups
        .filter(group => categorized.has(group.key))
        .map(group => {
            const groupAlbums = categorized.get(group.key)!

            // Innerhalb der Gruppe: neueste Einordnung zuerst
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
                    ? "Noch keine Einordnung"
                    : group.title,
                albums: groupAlbums,
            }
        })
}
