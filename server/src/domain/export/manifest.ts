/**
 * Export Manifest — Single Source of Truth for each export operation.
 * Written alongside the staged files and updated after apply.
 */

export interface ExportManifestAlbum {
    albumId: string
    relativePath: string
    artistName: string
    albumName: string
}

export interface ExportManifest {
    exportId: string
    createdAt: string
    status: "staged" | "applied"
    albums: ExportManifestAlbum[]
    totalSizeBytes: number
    fileCount: number
}

export function createManifest(
    exportId: string,
    albums: ExportManifestAlbum[],
    totalSizeBytes: number,
    fileCount: number,
    status: ExportManifest["status"] = "staged",
): ExportManifest {
    return {
        exportId,
        createdAt: new Date().toISOString(),
        status,
        albums,
        totalSizeBytes,
        fileCount,
    }
}
