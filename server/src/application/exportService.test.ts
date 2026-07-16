import { afterEach, describe, expect, it } from "vitest"
import { existsSync, mkdtempSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { initDatabase } from "../infrastructure/persistence/sqlite/connection.js"
import { createBindingRepository } from "../infrastructure/persistence/sqlite/bindingRepository.js"
import { createAlbumRepository } from "../infrastructure/persistence/sqlite/albumRepository.js"
import { createExportOperationRepository } from "../infrastructure/persistence/sqlite/exportOperationRepository.js"
import { createExportLockRepository } from "../infrastructure/persistence/sqlite/exportLockRepository.js"
import { createPathGuard } from "../infrastructure/filesystem/pathGuard.js"
import { createExportService } from "./exportService.js"

const LIBRARY_ALBUM_ID = "762afc5e-5408-4d9d-b48a-237874d7ec34"
const FILESYSTEM_ALBUM_ID = "Test Artist/Rotation NAS Acceptance Test"
const roots: string[] = []

afterEach(() => {
    for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true })
})

describe("ExportService canonical Album identity", () => {
    it("exports a Library UUID through its confirmed filesystem Binding", async () => {
        const root = mkdtempSync(join(tmpdir(), "rotation-export-service-"))
        roots.push(root)
        const musicRoot = join(root, "music")
        const workspaceRoot = join(root, "workspace")
        const sourceDir = join(musicRoot, FILESYSTEM_ALBUM_ID)
        mkdirSync(sourceDir, { recursive: true })
        mkdirSync(workspaceRoot, { recursive: true })
        writeFileSync(join(sourceDir, "track.mp3"), "audio")

        const db = initDatabase(":memory:")
        db.prepare(`
            INSERT INTO albums (
                id, title, artist, role_history, listen_count, created_at, updated_at
            ) VALUES (?, ?, ?, '[]', 0, ?, ?)
        `).run(
            LIBRARY_ALBUM_ID,
            "Rotation NAS Acceptance Test",
            "Test Artist",
            "2026-07-15T00:00:00.000Z",
            "2026-07-15T00:00:00.000Z",
        )

        const bindingRepo = createBindingRepository(db)
        bindingRepo.save({
            album_id: FILESYSTEM_ALBUM_ID,
            relative_path: FILESYSTEM_ALBUM_ID,
            state: "confirmed",
            match_source: "manual",
            proposed_at: "2026-07-15T00:00:00.000Z",
            confirmed_at: "2026-07-15T00:01:00.000Z",
            library_album_id: LIBRARY_ALBUM_ID,
        })

        const service = createExportService(
            bindingRepo,
            createExportOperationRepository(db),
            createExportLockRepository(db),
            createPathGuard(musicRoot),
            createPathGuard(workspaceRoot),
            createAlbumRepository(db),
        )

        const preview = service.createPreview([LIBRARY_ALBUM_ID])
        expect(preview.canExport).toBe(true)
        expect(preview.missingBindings).toEqual([])
        expect(preview.issues).toEqual([])
        expect(preview.sources).toEqual([
            expect.objectContaining({
                albumId: LIBRARY_ALBUM_ID,
                relativePath: FILESYSTEM_ALBUM_ID,
                artistName: "Test Artist",
                albumName: "Rotation NAS Acceptance Test",
            }),
        ])

        service.runStage(preview.exportId, [LIBRARY_ALBUM_ID])
        await new Promise<void>((resolve) => setImmediate(resolve))
        expect(service.getStageStatus(preview.exportId)?.status).toBe("staged")

        const applied = service.runApply(preview.exportId)
        const exportedTrack = join(
            applied.exportPath,
            FILESYSTEM_ALBUM_ID,
            "track.mp3",
        )
        expect(existsSync(exportedTrack)).toBe(true)
        expect(readFileSync(exportedTrack, "utf8")).toBe("audio")

        const manifest = JSON.parse(
            readFileSync(join(applied.exportPath, "manifest.json"), "utf8"),
        ) as { albums: Array<{ albumId: string; relativePath: string }> }
        expect(manifest.albums).toEqual([
            expect.objectContaining({
                albumId: LIBRARY_ALBUM_ID,
                relativePath: FILESYSTEM_ALBUM_ID,
            }),
        ])

        mkdirSync(join(applied.exportPath, ".stfolder"))
        writeFileSync(join(applied.exportPath, ".stfolder", "marker"), "syncthing")
        writeFileSync(join(applied.exportPath, ".stignore"), "(?d).DS_Store")
        writeFileSync(join(applied.exportPath, "stale-unmanaged-file.txt"), "must not survive")

        const repeatedPreview = service.createPreview([LIBRARY_ALBUM_ID])
        service.runStage(repeatedPreview.exportId, [LIBRARY_ALBUM_ID])
        await new Promise<void>((resolve) => setImmediate(resolve))

        // Syncthing still sees the complete previous rotation during staging.
        expect(existsSync(exportedTrack)).toBe(true)
        expect(readFileSync(exportedTrack, "utf8")).toBe("audio")

        const repeatedApply = service.runApply(repeatedPreview.exportId)
        expect(repeatedApply.archivePath).not.toBeNull()
        expect(repeatedApply.diff.added).toEqual([])
        expect(repeatedApply.diff.removed).toEqual([])
        expect(repeatedApply.diff.unchanged).toHaveLength(1)
        expect(existsSync(join(repeatedApply.exportPath, FILESYSTEM_ALBUM_ID, "track.mp3"))).toBe(true)
        expect(readdirSync(join(repeatedApply.exportPath, "Test Artist"))).toEqual([
            "Rotation NAS Acceptance Test",
        ])
        expect(readFileSync(join(repeatedApply.exportPath, ".stfolder", "marker"), "utf8")).toBe("syncthing")
        expect(readFileSync(join(repeatedApply.exportPath, ".stignore"), "utf8")).toBe("(?d).DS_Store")
        expect(existsSync(join(repeatedApply.exportPath, "stale-unmanaged-file.txt"))).toBe(false)

        db.close()
    })

    it("does not treat a filesystem Binding ID as a Library UUID", () => {
        const root = mkdtempSync(join(tmpdir(), "rotation-export-service-"))
        roots.push(root)
        const musicRoot = join(root, "music")
        const workspaceRoot = join(root, "workspace")
        mkdirSync(join(musicRoot, FILESYSTEM_ALBUM_ID), { recursive: true })
        mkdirSync(workspaceRoot, { recursive: true })

        const db = initDatabase(":memory:")
        const bindingRepo = createBindingRepository(db)
        bindingRepo.save({
            album_id: FILESYSTEM_ALBUM_ID,
            relative_path: FILESYSTEM_ALBUM_ID,
            state: "confirmed",
            match_source: "manual",
            proposed_at: null,
            confirmed_at: "2026-07-15T00:01:00.000Z",
            library_album_id: null,
        })
        const service = createExportService(
            bindingRepo,
            createExportOperationRepository(db),
            createExportLockRepository(db),
            createPathGuard(musicRoot),
            createPathGuard(workspaceRoot),
            createAlbumRepository(db),
        )

        const preview = service.createPreview([LIBRARY_ALBUM_ID])
        expect(preview.canExport).toBe(false)
        expect(preview.missingBindings).toEqual([LIBRARY_ALBUM_ID])
        expect(preview.issues).toEqual([
            {
                albumId: LIBRARY_ALBUM_ID,
                reason: "album-not-found",
            },
        ])
        db.close()
    })
})
