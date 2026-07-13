import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, realpathSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { createDirectoryScanner } from "./directoryScanner.js"
import { createPathGuard } from "./pathGuard.js"

describe("createDirectoryScanner", () => {
    let musicRoot: string

    beforeEach(() => {
        musicRoot = realpathSync(mkdtempSync(join(tmpdir(), "rotation-music-")))
    })

    afterEach(() => {
        rmSync(musicRoot, { recursive: true, force: true })
    })

    function createAlbum(artist: string, album: string): void {
        const dir = join(musicRoot, artist, album)
        mkdirSync(dir, { recursive: true })
        writeFileSync(join(dir, "01-track.mp3"), "dummy")
    }

    it("finds Artist/Album folders at depth 2", () => {
        createAlbum("Pink Floyd", "Dark Side of the Moon")
        createAlbum("Radiohead", "OK Computer")

        const guard = createPathGuard(musicRoot)
        const scan = createDirectoryScanner(guard)
        const result = scan()

        expect(result.albumFolders).toHaveLength(2)
        expect(result.albumFolders.map((f) => f.relativePath).sort()).toEqual([
            join("Pink Floyd", "Dark Side of the Moon"),
            join("Radiohead", "OK Computer"),
        ])
        expect(result.directoriesScanned).toBeGreaterThanOrEqual(2)
    })

    it("ignores files and non-album directories", () => {
        createAlbum("Artist", "Album")
        writeFileSync(join(musicRoot, "README.txt"), "notes")
        mkdirSync(join(musicRoot, "playlists"))
        writeFileSync(join(musicRoot, "playlists", "summer.m3u"), "")

        const guard = createPathGuard(musicRoot)
        const scan = createDirectoryScanner(guard)
        const result = scan()

        expect(result.albumFolders).toHaveLength(1)
        expect(result.albumFolders[0].relativePath).toBe(join("Artist", "Album"))
    })

    it("ignores entries in ignore list", () => {
        createAlbum("Artist", "Album")
        mkdirSync(join(musicRoot, ".DS_Store"))
        mkdirSync(join(musicRoot, "Artist", "@eaDir"))

        const guard = createPathGuard(musicRoot)
        const scan = createDirectoryScanner(guard)
        const result = scan()

        const paths = result.albumFolders.map((f) => f.relativePath)
        expect(paths).not.toContain(".DS_Store")
        expect(paths).not.toContain(join("Artist", "@eaDir"))
    })

    it("respects maxDepth option", () => {
        createAlbum("Artist", "Album")
        // With maxDepth 1 we cannot reach Album level (needs depth 2)
        const guard = createPathGuard(musicRoot)
        const scan = createDirectoryScanner(guard)
        const result = scan({ maxDepth: 1 })

        expect(result.albumFolders).toHaveLength(0)
        expect(result.directoriesScanned).toBeGreaterThan(0)
    })

    it("returns empty result when music root is empty", () => {
        const guard = createPathGuard(musicRoot)
        const scan = createDirectoryScanner(guard)
        const result = scan()

        expect(result.albumFolders).toHaveLength(0)
        expect(result.directoriesScanned).toBe(1)
    })

    it("returns empty result when music root is unreachable", () => {
        const nonExistentRoot = join(tmpdir(), "rotation-nonexistent-" + Date.now())
        const guard = createPathGuard(nonExistentRoot)
        const scan = createDirectoryScanner(guard)
        const result = scan()

        expect(result.albumFolders).toHaveLength(0)
        expect(result.directoriesScanned).toBe(0)
    })

    it("normalizes Unicode in folder names (NFC)", () => {
        // macOS APFS/HFS+ stores filenames in NFD (decomposed).
        // We normalize to NFC so albumIds stay stable across platforms.
        // NFD: e + combining acute accent; NFC: precomposed é
        const nfdAlbum = "caf\u0065\u0301" // "café" in NFD
        const nfcAlbum = "caf\u00e9"       // "café" in NFC
        const artistDir = join(musicRoot, "Artist")
        const albumDir = join(artistDir, nfdAlbum)
        mkdirSync(albumDir, { recursive: true })
        writeFileSync(join(albumDir, "01-track.mp3"), "dummy")

        const guard = createPathGuard(musicRoot)
        const scan = createDirectoryScanner(guard)
        const result = scan()

        const paths = result.albumFolders.map((f) => f.relativePath)
        expect(paths).toContain(join("Artist", nfcAlbum))
        expect(paths).not.toContain(join("Artist", nfdAlbum))
    })

    it("handles spaces and brackets in folder names", () => {
        createAlbum("Artist (Remix)", "Album [Deluxe Edition]")

        const guard = createPathGuard(musicRoot)
        const scan = createDirectoryScanner(guard)
        const result = scan()

        expect(result.albumFolders).toHaveLength(1)
        expect(result.albumFolders[0].relativePath).toBe(
            join("Artist (Remix)", "Album [Deluxe Edition]"),
        )
    })
})
