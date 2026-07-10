import type { Album } from "../../types/album"

import type { LibraryGroup } from "./libraryGroup"

/**
 * Gruppiert Alben alphabetisch nach Künstler.
 *
 * Alben ohne Künstler landen in der Gruppe „Unbekannt".
 */
export function groupByArtist(albums: Album[]): LibraryGroup[] {
    const groups = new Map<string, Album[]>()

    for (const album of albums) {
        const key = album.artist.trim() || "unknown"
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
        return a.localeCompare(b, "de")
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
