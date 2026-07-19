import { afterEach, describe, expect, it } from "vitest"
import { mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs"
import { createHash } from "node:crypto"
import { join } from "node:path"
import { tmpdir } from "node:os"
import sharp from "sharp"
import { createLocalArtworkService } from "./localArtworkService.js"
import { createPathGuard } from "../infrastructure/filesystem/pathGuard.js"
import type { BindingRepository } from "../infrastructure/persistence/sqlite/bindingRepository.js"

const temporaryDirectories: string[] = []
const binding = {
    album_id: "binding", relative_path: "Artist/Album", state: "confirmed" as const,
    match_source: "manual" as const, proposed_at: null, confirmed_at: new Date().toISOString(),
    library_album_id: "album",
}

afterEach(() => {
    for (const directory of temporaryDirectories.splice(0)) rmSync(directory, { recursive: true, force: true })
})

describe("local artwork service", () => {
    it.each([
        ["cover.jpg", "jpeg", "image/jpeg"],
        ["folder.png", "png", "image/png"],
        ["front.webp", "webp", "image/webp"],
    ] as const)("accepts bounded folder artwork %s", async (filename, format, contentType) => {
        const { albumDirectory, service } = setup()
        writeFileSync(join(albumDirectory, filename), await image(format, "navy"))

        await expect(service.findForAlbum("album")).resolves.toMatchObject({
            source: "folder",
            contentType,
        })
    })

    it("prefers the first valid deterministic folder candidate", async () => {
        const { root, albumDirectory, service } = setup()
        void root
        writeFileSync(join(albumDirectory, "cover.jpg"), "corrupt")
        writeFileSync(join(albumDirectory, "folder.png"), await image("png", "green"))
        writeFileSync(join(albumDirectory, "front.webp"), await image("webp", "blue"))

        await expect(service.findForAlbum("album")).resolves.toMatchObject({
            source: "folder",
            contentType: "image/png",
        })
    })

    it("extracts embedded artwork when folder artwork is absent", async () => {
        const { albumDirectory, service } = setup()
        const cover = await image("png", "purple")
        writeFileSync(join(albumDirectory, "track.mp3"), id3WithCover(cover))

        await expect(service.findForAlbum("album")).resolves.toMatchObject({
            source: "embedded",
            contentType: "image/png",
        })
    })

    it("treats missing and corrupt local artwork as a bounded miss", async () => {
        const { albumDirectory, service } = setup()
        writeFileSync(join(albumDirectory, "cover.jpg"), "not an image")
        writeFileSync(join(albumDirectory, "track.flac"), "not valid media")

        await expect(service.findForAlbum("album")).resolves.toBeNull()
    })

    it("does not modify folder artwork or embedded media while reading", async () => {
        const { albumDirectory, service } = setup()
        const coverPath = join(albumDirectory, "cover.png")
        const audioPath = join(albumDirectory, "track.mp3")
        writeFileSync(coverPath, await image("png", "orange"))
        writeFileSync(audioPath, id3WithCover(await image("png", "purple")))
        const before = [snapshot(coverPath), snapshot(audioPath)]

        await service.findForAlbum("album")

        expect([snapshot(coverPath), snapshot(audioPath)]).toEqual(before)
    })

    it("requires a confirmed binding for the canonical library album", async () => {
        const { service } = setup({ state: "proposed" })
        await expect(service.findForAlbum("album")).resolves.toBeNull()
        await expect(service.findForAlbum("another-album")).resolves.toBeNull()
    })
})

function setup(overrides: { state?: "confirmed" | "proposed" } = {}) {
    const root = mkdtempSync(join(tmpdir(), "rotation-local-artwork-"))
    temporaryDirectories.push(root)
    const albumDirectory = join(root, "Artist", "Album")
    mkdirSync(albumDirectory, { recursive: true })
    const record = { ...binding, ...overrides }
    const repo = { findByLibraryAlbumId: () => record } as unknown as BindingRepository
    return { root, albumDirectory, service: createLocalArtworkService(repo, createPathGuard(root)) }
}

async function image(format: "jpeg" | "png" | "webp", color: string): Promise<Buffer> {
    return sharp({ create: { width: 4, height: 4, channels: 3, background: color } })[format]().toBuffer()
}

function snapshot(path: string) {
    const fileStat = statSync(path)
    return {
        size: fileStat.size,
        modifiedAt: fileStat.mtimeMs,
        digest: createHash("sha256").update(readFileSync(path)).digest("hex"),
    }
}

function id3WithCover(cover: Buffer): Buffer {
    const body = Buffer.concat([
        Buffer.from([0]), Buffer.from("image/png\0", "latin1"), Buffer.from([3, 0]), cover,
    ])
    const frameHeader = Buffer.alloc(10)
    frameHeader.write("APIC", 0, "ascii")
    frameHeader.writeUInt32BE(body.length, 4)
    const tag = Buffer.concat([frameHeader, body])
    const header = Buffer.from([0x49, 0x44, 0x33, 3, 0, 0, ...synchsafe(tag.length)])
    return Buffer.concat([header, tag])
}

function synchsafe(size: number): [number, number, number, number] {
    return [(size >> 21) & 0x7f, (size >> 14) & 0x7f, (size >> 7) & 0x7f, size & 0x7f]
}
