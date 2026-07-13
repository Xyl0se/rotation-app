import { describe, it, expect, beforeEach } from "vitest"
import Database from "better-sqlite3"
import { initDatabase } from "../infrastructure/persistence/sqlite/connection.js"
import { createBindingRepository } from "../infrastructure/persistence/sqlite/bindingRepository.js"
import { createScanRunRepository } from "../infrastructure/persistence/sqlite/scanRunRepository.js"
import { createScanService } from "./scanService.js"
import type { DirectoryScanner } from "../infrastructure/filesystem/directoryScanner.js"

describe("createScanService", () => {
    let db: Database.Database
    let bindingRepo: ReturnType<typeof createBindingRepository>
    let scanRunRepo: ReturnType<typeof createScanRunRepository>

    beforeEach(() => {
        db = new Database(":memory:")
        db.exec(`
            CREATE TABLE IF NOT EXISTS bindings (
                album_id TEXT PRIMARY KEY,
                relative_path TEXT NOT NULL,
                state TEXT CHECK(state IN ('unbound', 'proposed', 'confirmed', 'missing')) NOT NULL DEFAULT 'unbound',
                match_source TEXT CHECK(match_source IN ('scan-exact', 'manual')),
                proposed_at TEXT,
                confirmed_at TEXT
            );
            CREATE TABLE IF NOT EXISTS scan_runs (
                id TEXT PRIMARY KEY,
                started_at TEXT NOT NULL,
                finished_at TEXT NOT NULL,
                directories_scanned INTEGER NOT NULL DEFAULT 0,
                directories_skipped INTEGER NOT NULL DEFAULT 0,
                album_folders_found INTEGER NOT NULL DEFAULT 0,
                status TEXT CHECK(status IN ('running', 'completed', 'failed')) NOT NULL DEFAULT 'running',
                error_message TEXT
            );
        `)
        bindingRepo = createBindingRepository(db)
        scanRunRepo = createScanRunRepository(db)
    })

    function makeScanner(result: { albumFolders: { relativePath: string; albumName: string; artistName: string; absolutePath: string }[]; directoriesScanned: number; directoriesSkipped: number }): DirectoryScanner {
        return () => ({
            albumFolders: result.albumFolders,
            directoriesScanned: result.directoriesScanned,
            directoriesSkipped: result.directoriesSkipped,
            startedAt: new Date(),
            finishedAt: new Date(),
        })
    }

    it("records a running scan, then completes with proposed bindings", () => {
        const scanner = makeScanner({
            albumFolders: [
                { relativePath: "Artist/Album", albumName: "Album", artistName: "Artist", absolutePath: "/music/Artist/Album" },
            ],
            directoriesScanned: 3,
            directoriesSkipped: 0,
        })

        const service = createScanService(scanner, bindingRepo, scanRunRepo)
        service.runScan("scan-1")

        const run = scanRunRepo.findById("scan-1")
        expect(run).toBeDefined()
        expect(run!.status).toBe("completed")
        expect(run!.directories_scanned).toBe(3)
        expect(run!.album_folders_found).toBe(1)

        const bindings = bindingRepo.findByState("proposed")
        expect(bindings).toHaveLength(1)
        expect(bindings[0].relative_path).toBe("Artist/Album")
        expect(bindings[0].match_source).toBe("scan-exact")
    })

    it("records a failed scan on scanner error", () => {
        const failingScanner: DirectoryScanner = () => {
            throw new Error("disk error")
        }

        const service = createScanService(failingScanner, bindingRepo, scanRunRepo)
        expect(() => service.runScan("scan-2")).toThrow("disk error")

        const run = scanRunRepo.findById("scan-2")
        expect(run).toBeDefined()
        expect(run!.status).toBe("failed")
        expect(run!.error_message).toBe("disk error")
    })

    it("upserts multiple bindings from a single scan", () => {
        const scanner = makeScanner({
            albumFolders: [
                { relativePath: "A/One", albumName: "One", artistName: "A", absolutePath: "/music/A/One" },
                { relativePath: "B/Two", albumName: "Two", artistName: "B", absolutePath: "/music/B/Two" },
            ],
            directoriesScanned: 5,
            directoriesSkipped: 1,
        })

        const service = createScanService(scanner, bindingRepo, scanRunRepo)
        service.runScan("scan-3")

        const all = bindingRepo.findAll()
        expect(all).toHaveLength(2)
    })

    it("does not mark confirmed bindings as missing when root is unreachable", () => {
        // Pre-create a confirmed binding
        bindingRepo.save({
            album_id: "Artist/Album",
            relative_path: "Artist/Album",
            state: "confirmed",
            match_source: "scan-exact",
            proposed_at: "2024-01-01T00:00:00Z",
            confirmed_at: "2024-01-01T00:00:00Z",
        })

        // Simulate unreachable root: 0 directories scanned
        const scanner = makeScanner({
            albumFolders: [],
            directoriesScanned: 0,
            directoriesSkipped: 0,
        })

        const service = createScanService(scanner, bindingRepo, scanRunRepo)
        service.runScan("scan-4")

        const run = scanRunRepo.findById("scan-4")
        expect(run!.status).toBe("completed")

        const confirmed = bindingRepo.findByState("confirmed")
        expect(confirmed).toHaveLength(1)
        expect(confirmed[0].relative_path).toBe("Artist/Album")
    })

    it("is idempotent: second scan does not change proposed_at if path is unchanged", () => {
        const scanner = makeScanner({
            albumFolders: [
                { relativePath: "Artist/Album", albumName: "Album", artistName: "Artist", absolutePath: "/music/Artist/Album" },
            ],
            directoriesScanned: 3,
            directoriesSkipped: 0,
        })

        const service = createScanService(scanner, bindingRepo, scanRunRepo)
        service.runScan("scan-5a")

        const firstRun = scanRunRepo.findById("scan-5a")
        expect(firstRun!.status).toBe("completed")

        const firstBinding = bindingRepo.findById("Artist/Album")
        expect(firstBinding).toBeDefined()
        const firstProposedAt = firstBinding!.proposed_at

        // Run again with same data
        service.runScan("scan-5b")

        const secondBinding = bindingRepo.findById("Artist/Album")
        expect(secondBinding!.proposed_at).toBe(firstProposedAt)
        expect(secondBinding!.relative_path).toBe("Artist/Album")
    })
})
