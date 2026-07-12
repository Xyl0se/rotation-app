import type { ExportManifest, ExportManifestAlbum } from "./manifest.js"

export interface ExportDiff {
    added: ExportManifestAlbum[]       // Albums in new export but not in current
    removed: ExportManifestAlbum[]     // Albums in current but not in new export
    unchanged: ExportManifestAlbum[]   // Albums present in both
    previousExportId: string | null
    previousAlbumCount: number
    newAlbumCount: number
}

/**
 * Compares a new set of albums against the currently applied export manifest.
 * Returns a diff showing what would change.
 */
export function calculateExportDiff(
    newAlbums: ExportManifestAlbum[],
    currentManifest: ExportManifest | null,
): ExportDiff {
    if (!currentManifest) {
        return {
            added: newAlbums,
            removed: [],
            unchanged: [],
            previousExportId: null,
            previousAlbumCount: 0,
            newAlbumCount: newAlbums.length,
        }
    }

    const currentById = new Map(currentManifest.albums.map((a) => [a.albumId, a]))
    const newById = new Map(newAlbums.map((a) => [a.albumId, a]))

    const added: ExportManifestAlbum[] = []
    const removed: ExportManifestAlbum[] = []
    const unchanged: ExportManifestAlbum[] = []

    for (const album of newAlbums) {
        if (currentById.has(album.albumId)) {
            unchanged.push(album)
        } else {
            added.push(album)
        }
    }

    for (const album of currentManifest.albums) {
        if (!newById.has(album.albumId)) {
            removed.push(album)
        }
    }

    return {
        added,
        removed,
        unchanged,
        previousExportId: currentManifest.exportId,
        previousAlbumCount: currentManifest.albums.length,
        newAlbumCount: newAlbums.length,
    }
}

export interface ExportDiffSummary {
    addedCount: number
    removedCount: number
    unchangedCount: number
    previousAlbumCount: number
    newAlbumCount: number
}

export function summarizeDiff(diff: ExportDiff): ExportDiffSummary {
    return {
        addedCount: diff.added.length,
        removedCount: diff.removed.length,
        unchangedCount: diff.unchanged.length,
        previousAlbumCount: diff.previousAlbumCount,
        newAlbumCount: diff.newAlbumCount,
    }
}
