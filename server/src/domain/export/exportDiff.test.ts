import { describe, it, expect } from "vitest"
import { calculateExportDiff, summarizeDiff } from "./exportDiff.js"
import type { ExportManifest, ExportManifestAlbum } from "./manifest.js"

function makeAlbum(id: string): ExportManifestAlbum {
    return {
        albumId: id,
        relativePath: id,
        artistName: "Artist",
        albumName: id,
    }
}

describe("calculateExportDiff", () => {
    it("treats all albums as added when no current manifest", () => {
        const albums = [makeAlbum("a"), makeAlbum("b")]
        const diff = calculateExportDiff(albums, null)

        expect(diff.added).toHaveLength(2)
        expect(diff.removed).toHaveLength(0)
        expect(diff.unchanged).toHaveLength(0)
        expect(diff.previousExportId).toBeNull()
        expect(diff.previousAlbumCount).toBe(0)
        expect(diff.newAlbumCount).toBe(2)
    })

    it("identifies added, removed and unchanged albums", () => {
        const current: ExportManifest = {
            exportId: "old",
            createdAt: "2026-01-01",
            albums: [makeAlbum("a"), makeAlbum("b"), makeAlbum("c")],
            totalSizeBytes: 0,
            fileCount: 0,
            status: "applied",
        }

        const newAlbums = [makeAlbum("a"), makeAlbum("d")] // a stays, b/c removed, d added
        const diff = calculateExportDiff(newAlbums, current)

        expect(diff.added.map((a) => a.albumId)).toEqual(["d"])
        expect(diff.removed.map((a) => a.albumId)).toEqual(["b", "c"])
        expect(diff.unchanged.map((a) => a.albumId)).toEqual(["a"])
        expect(diff.previousExportId).toBe("old")
        expect(diff.previousAlbumCount).toBe(3)
        expect(diff.newAlbumCount).toBe(2)
    })

    it("handles empty new export", () => {
        const current: ExportManifest = {
            exportId: "old",
            createdAt: "2026-01-01",
            albums: [makeAlbum("a")],
            totalSizeBytes: 0,
            fileCount: 0,
            status: "applied",
        }

        const diff = calculateExportDiff([], current)

        expect(diff.added).toHaveLength(0)
        expect(diff.removed.map((a) => a.albumId)).toEqual(["a"])
        expect(diff.unchanged).toHaveLength(0)
        expect(diff.newAlbumCount).toBe(0)
    })
})

describe("summarizeDiff", () => {
    it("summarizes counts", () => {
        const diff = calculateExportDiff([makeAlbum("a"), makeAlbum("b")], null)
        const summary = summarizeDiff(diff)

        expect(summary.addedCount).toBe(2)
        expect(summary.removedCount).toBe(0)
        expect(summary.unchangedCount).toBe(0)
        expect(summary.previousAlbumCount).toBe(0)
        expect(summary.newAlbumCount).toBe(2)
    })
})
