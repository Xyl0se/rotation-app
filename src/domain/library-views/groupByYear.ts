import type { Album } from "../../types/album"

import type { LibraryGroup } from "./libraryGroup"

/**
 * Gruppiert Alben chronologisch nach Erscheinungsjahr.
 *
 * Alben ohne Jahr landen in der Gruppe „Unbekannt".
 * Die Gruppen sind absteigend sortiert (neuestes Jahr oben).
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
        // "unknown" immer ans Ende
        if (a === "unknown") return 1
        if (b === "unknown") return -1

        // Numerisch absteigend sortieren
        const yearA = parseInt(a, 10)
        const yearB = parseInt(b, 10)

        if (!Number.isNaN(yearA) && !Number.isNaN(yearB)) {
            return yearB - yearA
        }

        // Fallback für nicht-numerische Jahre
        return b.localeCompare(a, "de")
    })

    return sortedKeys.map(key => {
        const groupAlbums = groups.get(key)!

        // Innerhalb der Gruppe alphabetisch nach Titel sortieren
        groupAlbums.sort((a, b) =>
            a.title.localeCompare(b.title, "de"),
        )

        return {
            key,
            title: key === "unknown" ? "Unbekannt" : key,
            albums: groupAlbums,
        }
    })
}
