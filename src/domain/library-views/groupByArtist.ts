import type { Album } from "../../types/album"

import type { LibraryGroup } from "./libraryGroup"

/**
 * Groups albums alphabetically by artist.
 *
 * Albums without an artist land in the group "Unknown".
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
        // Always sort "unknown" to the end
        if (a === "unknown") return 1
        if (b === "unknown") return -1
        return a.localeCompare(b, "de")
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
