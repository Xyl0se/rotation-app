import type { Album } from "../../types/album"

import type { LibraryGroup } from "./libraryGroup"

/**
 * Groups albums chronologically by release year.
 *
 * Albums without a year land in the group "Unknown".
 * Groups are sorted in descending order (newest year first).
 */
export function groupByYear(albums: Album[]): LibraryGroup[] {
    const groups = new Map<string, Album[]>()

    for (const album of albums) {
        const key = album.year.trim() || "unknown"
        const existing = groups.get(key)

        if (existing) {
            existing.push(album)
        } else {
            groups.set(key, [album])
        }
    }

    const sortedKeys = Array.from(groups.keys()).sort((a, b) => {
        // Always sort "unknown" to the end
        if (a === "unknown") return 1
        if (b === "unknown") return -1

        // Sort numerically in descending order
        const yearA = parseInt(a, 10)
        const yearB = parseInt(b, 10)

        if (!Number.isNaN(yearA) && !Number.isNaN(yearB)) {
            return yearB - yearA
        }

        // Fallback for non-numeric years
        return b.localeCompare(a, "de")
    })

    return sortedKeys.map(key => {
        const groupAlbums = groups.get(key)!

        // Within the group: sort alphabetically by title
        groupAlbums.sort((a, b) =>
            a.title.localeCompare(b.title, "de"),
        )

        return {
            key,
            title: key === "unknown" ? "Unknown" : key,
            albums: groupAlbums,
        }
    })
}
