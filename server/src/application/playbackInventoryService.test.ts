import { afterEach, describe, expect, it } from "vitest"
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { createPlaybackInventoryService } from "./playbackInventoryService.js"
import { createPathGuard } from "../infrastructure/filesystem/pathGuard.js"
import type { BindingRepository } from "../infrastructure/persistence/sqlite/bindingRepository.js"

const temporaryDirectories: string[] = []

afterEach(() => {
    for (const directory of temporaryDirectories.splice(0)) rmSync(directory, { recursive: true, force: true })
})

function repository(relativePaths: string[]): BindingRepository {
    return {
        findByState: () => relativePaths.map((relative_path, index) => ({
            album_id: `binding-${index}`,
            relative_path,
            state: "confirmed",
            match_source: "manual",
            proposed_at: null,
            confirmed_at: new Date().toISOString(),
            library_album_id: `album-${index}`,
        })),
    } as unknown as BindingRepository
}

describe("playback inventory service", () => {
    it("reports bounded aggregate evidence without paths, filenames, or tag text", async () => {
        const musicRoot = mkdtempSync(join(tmpdir(), "rotation-playback-inventory-"))
        temporaryDirectories.push(musicRoot)
        const albumDirectory = join(musicRoot, "Private Artist", "Private Album")
        mkdirSync(albumDirectory, { recursive: true })
        writeFileSync(join(albumDirectory, "01 Geheim.mp3"), "deliberately invalid media")
        writeFileSync(join(albumDirectory, "cover.jpg"), "not audio")

        const report = await createPlaybackInventoryService(
            repository(["Private Artist/Private Album"]),
            createPathGuard(musicRoot),
        ).run()

        expect(report).toMatchObject({
            bindingsAvailable: 1,
            bindingsInspected: 1,
            albumsWithPlayableFiles: 1,
            filesInspected: 1,
            albumsWithUnicodeNames: 0,
            albumsWithAmbiguousOrdering: 0,
        })
        expect(report.formats.find(format => format.format === "mp3")).toMatchObject({
            files: 1,
            filenameFallbackRequired: 1,
        })
        const serialized = JSON.stringify(report)
        expect(serialized).not.toContain("Private")
        expect(serialized).not.toContain("Geheim")
        expect(serialized).not.toContain(musicRoot)
    })

    it("counts missing metadata as ambiguous only when an album has multiple files", async () => {
        const musicRoot = mkdtempSync(join(tmpdir(), "rotation-playback-inventory-"))
        temporaryDirectories.push(musicRoot)
        const albumDirectory = join(musicRoot, "Artist", "Älbum")
        mkdirSync(albumDirectory, { recursive: true })
        writeFileSync(join(albumDirectory, "one.flac"), "invalid")
        writeFileSync(join(albumDirectory, "two.flac"), "invalid")

        const report = await createPlaybackInventoryService(
            repository(["Artist/Älbum"]),
            createPathGuard(musicRoot),
        ).run()

        expect(report.filesInspected).toBe(2)
        expect(report.albumsWithAmbiguousOrdering).toBe(1)
    })

    it("includes bounded multi-disc subdirectories", async () => {
        const musicRoot = mkdtempSync(join(tmpdir(), "rotation-playback-inventory-"))
        temporaryDirectories.push(musicRoot)
        mkdirSync(join(musicRoot, "Artist", "Album", "CD 1"), { recursive: true })
        mkdirSync(join(musicRoot, "Artist", "Album", "CD 2"), { recursive: true })
        writeFileSync(join(musicRoot, "Artist", "Album", "CD 1", "one.m4a"), "invalid")
        writeFileSync(join(musicRoot, "Artist", "Album", "CD 2", "two.m4a"), "invalid")

        const report = await createPlaybackInventoryService(
            repository(["Artist/Album"]),
            createPathGuard(musicRoot),
        ).run()

        expect(report.filesInspected).toBe(2)
        expect(report.formats.find(format => format.format === "m4a")?.files).toBe(2)
    })

    it("returns empty format buckets when no confirmed bindings exist", async () => {
        const musicRoot = mkdtempSync(join(tmpdir(), "rotation-playback-inventory-"))
        temporaryDirectories.push(musicRoot)

        const report = await createPlaybackInventoryService(repository([]), createPathGuard(musicRoot)).run()

        expect(report.bindingsAvailable).toBe(0)
        expect(report.filesInspected).toBe(0)
        expect(report.formats.map(format => format.format)).toEqual(["mp3", "m4a", "flac"])
    })
})
