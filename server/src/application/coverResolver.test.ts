import { afterEach, describe, expect, it, vi } from "vitest"
import { mkdtempSync, rmSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import sharp from "sharp"
import { createCoverService } from "./coverService.js"
import { createCoverResolver } from "./coverResolver.js"
import type { LocalArtworkService } from "./localArtworkService.js"

const ALBUM_ID = "550e8400-e29b-41d4-a716-446655440000"
const temporaryDirectories: string[] = []

afterEach(() => {
    vi.unstubAllGlobals()
    for (const directory of temporaryDirectories.splice(0)) rmSync(directory, { recursive: true, force: true })
})

describe("cover resolver", () => {
    it("prefers validated local artwork before remote candidates", async () => {
        const coverService = service()
        const buffer = await sharp({
            create: { width: 5, height: 5, channels: 3, background: "orange" },
        }).png().toBuffer()
        const local = { findForAlbum: vi.fn(async () => ({
            buffer, contentType: "image/png" as const, width: 5, height: 5, source: "folder" as const,
        })) } as LocalArtworkService
        const fetchMock = vi.fn()
        vi.stubGlobal("fetch", fetchMock)

        await expect(createCoverResolver(coverService, local).resolve(
            ALBUM_ID,
            ["https://coverartarchive.org/release/id/front"],
        )).resolves.toEqual({ status: "cached", source: "folder" })
        expect(fetchMock).not.toHaveBeenCalled()
        expect(coverService.getMeta(ALBUM_ID)).toMatchObject({ source: "folder" })
    })

    it("never replaces an explicit upload during automatic resolution", async () => {
        const coverService = service()
        const buffer = await sharp({
            create: { width: 3, height: 3, channels: 3, background: "black" },
        }).png().toBuffer()
        await coverService.saveValidatedCover(ALBUM_ID, buffer, "image/png", "upload")
        const local = { findForAlbum: vi.fn() } as unknown as LocalArtworkService

        await expect(createCoverResolver(coverService, local).resolve(ALBUM_ID, [
            "https://coverartarchive.org/release/id/front",
        ])).resolves.toEqual({ status: "cached", source: "upload" })
        expect(local.findForAlbum).not.toHaveBeenCalled()
    })

    it("falls back to remote resolution after a local miss", async () => {
        const coverService = service()
        const buffer = await sharp({
            create: { width: 2, height: 2, channels: 3, background: "white" },
        }).jpeg().toBuffer()
        const responseBody = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer
        vi.stubGlobal("fetch", vi.fn(async () => new Response(responseBody, {
            status: 200,
            headers: { "content-type": "image/jpeg", "content-length": String(buffer.length) },
        })))
        const local = { findForAlbum: vi.fn(async () => null) } as LocalArtworkService

        await expect(createCoverResolver(coverService, local).resolve(ALBUM_ID, [
            "https://coverartarchive.org/release/id/front",
        ])).resolves.toEqual({ status: "cached", source: "remote" })
        expect(coverService.getMeta(ALBUM_ID)).toMatchObject({ source: "remote" })
    })

    it("keeps a last known-good cache unless an explicit retry forces refresh", async () => {
        const coverService = service()
        const cached = await sharp({
            create: { width: 2, height: 2, channels: 3, background: "gray" },
        }).png().toBuffer()
        await coverService.saveValidatedCover(ALBUM_ID, cached, "image/png", "remote")
        const local = { findForAlbum: vi.fn(async () => null) } as LocalArtworkService
        const fetchMock = vi.fn()
        vi.stubGlobal("fetch", fetchMock)

        await expect(createCoverResolver(coverService, local).resolve(ALBUM_ID, [
            "https://coverartarchive.org/release/id/front",
        ])).resolves.toEqual({ status: "cached", source: "cache" })
        expect(fetchMock).not.toHaveBeenCalled()
        expect(coverService.getMeta(ALBUM_ID)).toMatchObject({
            resolutionStatus: "cached",
            failureCode: "local-artwork-not-found",
        })
    })

    it("reuses server-stored remote candidates when retry receives no browser URLs", async () => {
        const coverService = service()
        const local = { findForAlbum: vi.fn(async () => null) } as LocalArtworkService
        vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 404 })))
        await createCoverResolver(coverService, local).resolve(ALBUM_ID, [
            "https://coverartarchive.org/release/id/front",
        ], true)

        const image = await sharp({
            create: { width: 2, height: 2, channels: 3, background: "green" },
        }).png().toBuffer()
        const responseBody = image.buffer.slice(image.byteOffset, image.byteOffset + image.byteLength) as ArrayBuffer
        const retryFetch = vi.fn(async () => new Response(responseBody, {
            status: 200,
            headers: { "content-type": "image/png" },
        }))
        vi.stubGlobal("fetch", retryFetch)

        await expect(createCoverResolver(coverService, local).resolve(ALBUM_ID, [], true))
            .resolves.toEqual({ status: "cached", source: "remote" })
        expect(retryFetch).toHaveBeenCalledWith(
            new URL("https://coverartarchive.org/release/id/front"),
            expect.objectContaining({ redirect: "follow" }),
        )
    })
})

function service() {
    const directory = mkdtempSync(join(tmpdir(), "rotation-cover-resolver-"))
    temporaryDirectories.push(directory)
    return createCoverService(directory)
}
