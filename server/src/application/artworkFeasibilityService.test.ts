import { afterEach, describe, expect, it } from "vitest"
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { createArtworkFeasibilityService } from "./artworkFeasibilityService.js"
import { createPathGuard } from "../infrastructure/filesystem/pathGuard.js"
import type { BindingRepository } from "../infrastructure/persistence/sqlite/bindingRepository.js"

const temporaryDirectories: string[] = []

afterEach(() => {
    for (const directory of temporaryDirectories.splice(0)) rmSync(directory, { recursive: true, force: true })
})

describe("artwork feasibility service", () => {
    it("selects bounded confirmed-binding samples and sanitizes parser failures", async () => {
        const musicRoot = mkdtempSync(join(tmpdir(), "rotation-artwork-probe-"))
        temporaryDirectories.push(musicRoot)
        const albumDirectory = join(musicRoot, "Artist", "Album")
        mkdirSync(albumDirectory, { recursive: true })
        writeFileSync(join(albumDirectory, "track.mp3"), "deliberately invalid media")
        writeFileSync(join(albumDirectory, "notes.txt"), "/private/music/secret")

        const bindingRepo = {
            findByState: () => [{
                album_id: "binding",
                relative_path: "Artist/Album",
                state: "confirmed",
                match_source: "manual",
                proposed_at: null,
                confirmed_at: new Date().toISOString(),
                library_album_id: "album",
            }],
        } as unknown as BindingRepository

        const report = await createArtworkFeasibilityService(
            bindingRepo,
            createPathGuard(musicRoot),
        ).run()

        expect(report.bindingsInspected).toBe(1)
        expect(report.missingFormats).toEqual(["m4a", "flac"])
        expect(report.samples).toHaveLength(1)
        expect(report.samples[0]).toMatchObject({
            format: "mp3",
            audioBytes: 26,
            outcome: "parse-error",
            failureCode: "invalid-media",
        })
        expect(JSON.stringify(report)).not.toContain("Artist")
        expect(JSON.stringify(report)).not.toContain("secret")
    })

    it("returns an empty report when no confirmed binding exists", async () => {
        const musicRoot = mkdtempSync(join(tmpdir(), "rotation-artwork-probe-"))
        temporaryDirectories.push(musicRoot)
        const bindingRepo = { findByState: () => [] } as unknown as BindingRepository

        const report = await createArtworkFeasibilityService(
            bindingRepo,
            createPathGuard(musicRoot),
        ).run()

        expect(report.bindingsInspected).toBe(0)
        expect(report.samples).toEqual([])
        expect(report.missingFormats).toEqual(["mp3", "m4a", "flac"])
    })
})
