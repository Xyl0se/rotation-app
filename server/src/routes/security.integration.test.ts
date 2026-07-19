import { afterAll, beforeAll, describe, expect, it, vi } from "vitest"
import express from "express"
import type { Server } from "node:http"
import type { AddressInfo } from "node:net"

import { createAlbumsRouter } from "./albums.js"
import { createBackupsRouter } from "./backups.js"
import { createBindingsRouter } from "./bindings.js"
import { createCoversRouter } from "./covers.js"
import { createExportsRouter } from "./exports.js"
import { createScanRouter } from "./scan.js"
import { createRequireWriteToken, createRequireWriteTokenForMutations, requireSameOriginForMutations } from "./middleware/writeToken.js"
import { createApiErrorHandler } from "./middleware/apiError.js"
import type { AlbumRepository } from "../infrastructure/persistence/sqlite/albumRepository.js"
import type { BackupStatusRepository } from "../infrastructure/persistence/sqlite/backupStatusRepository.js"
import type { BindingRepository } from "../infrastructure/persistence/sqlite/bindingRepository.js"
import type { ExportService } from "../application/exportService.js"
import type { PathGuard } from "../infrastructure/filesystem/pathGuard.js"
import type { ScanRunRepository } from "../infrastructure/persistence/sqlite/scanRunRepository.js"
import type { ScanService } from "../application/scanService.js"
import type { BackupScheduler } from "../application/backupScheduler.js"
import type { BackupService } from "../application/backupService.js"
import type { BindingCaptureService } from "../application/bindingCaptureService.js"
import type { CoverService } from "../application/coverService.js"

const WRITE_TOKEN = "integration-test-token"
const ALBUM_ID = "550e8400-e29b-41d4-a716-446655440000"
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64")

interface RouteCase {
    name: string
    method: "POST" | "PUT" | "DELETE"
    path: string
    body?: unknown
    rawBody?: Buffer
    contentType?: string
}

function expectedAuthorizedStatus(route: RouteCase): number {
    if (route.method === "DELETE") return 204
    if (route.path === "/albums" || route.path === "/scan" || route.path === "/bindings/capture" || route.path.startsWith("/covers/")) return 201
    if (route.path === "/exports/stage") return 202
    return 200
}

const mutationRoutes: RouteCase[] = [
    { name: "create album", method: "POST", path: "/albums", body: { id: "650e8400-e29b-41d4-a716-446655440000", title: "Album", artist: "Artist" } },
    { name: "update album", method: "PUT", path: `/albums/${ALBUM_ID}`, body: { title: "Album", artist: "Artist" } },
    { name: "delete album", method: "DELETE", path: `/albums/${ALBUM_ID}` },
    { name: "import albums", method: "POST", path: "/albums/import", body: { albums: [] } },
    { name: "upload cover", method: "POST", path: `/covers/${ALBUM_ID}`, rawBody: PNG, contentType: "image/png" },
    { name: "delete cover", method: "DELETE", path: `/covers/${ALBUM_ID}` },
    { name: "confirm binding", method: "POST", path: "/bindings/confirm", body: { albumId: ALBUM_ID } },
    { name: "link binding", method: "POST", path: "/bindings/link", body: { albumId: ALBUM_ID, libraryAlbumId: ALBUM_ID } },
    { name: "unlink binding", method: "POST", path: "/bindings/unlink", body: { albumId: ALBUM_ID } },
    { name: "verify bindings", method: "POST", path: "/bindings/verify" },
    { name: "reconcile bindings", method: "POST", path: "/bindings/reconcile" },
    { name: "delete binding", method: "DELETE", path: `/bindings?albumId=${ALBUM_ID}` },
    { name: "preview export", method: "POST", path: "/exports/preview", body: { albumIds: [], rotationPlanId: ALBUM_ID } },
    { name: "calculate export diff", method: "POST", path: "/exports/diff", body: { albumIds: [], rotationPlanId: ALBUM_ID } },
    { name: "stage export", method: "POST", path: "/exports/stage", body: { exportId: ALBUM_ID, albumIds: [], rotationPlanId: ALBUM_ID } },
    { name: "apply export", method: "POST", path: "/exports/apply", body: { exportId: ALBUM_ID } },
    { name: "run backup", method: "POST", path: "/backups/run" },
    { name: "capture binding", method: "POST", path: "/bindings/capture", body: {
        albumId: ALBUM_ID,
        album: { id: ALBUM_ID, title: "Album", artist: "Artist" },
    } },
]

function bindingRecord() {
    return {
        album_id: ALBUM_ID,
        relative_path: "Artist/Album",
        state: "proposed",
        match_source: null,
        proposed_at: null,
        confirmed_at: null,
        library_album_id: ALBUM_ID,
        title: "Album",
        artist: "Artist",
    }
}

function createTestApp() {
    const albumRepo = {
        findAll: vi.fn(() => []),
        findById: vi.fn((id: string) => id === ALBUM_ID ? ({
                id: ALBUM_ID,
                title: "Album",
                artist: "Artist",
                year: "",
                roleHistory: [],
                listenCount: 0,
                lastListened: null,
            }) : undefined),
        save: vi.fn(),
        saveMany: vi.fn(),
        delete: vi.fn(() => true),
        exists: vi.fn(() => true),
        findByArtist: vi.fn(() => []),
        findByTitle: vi.fn(() => []),
    } as unknown as AlbumRepository

    const bindingRepo = {
        findWithAlbumDataById: vi.fn(bindingRecord),
        findWithAlbumDataByState: vi.fn(() => []),
        findWithAlbumData: vi.fn(() => []),
        findOrphans: vi.fn(() => []),
        findByLibraryAlbumId: vi.fn(() => bindingRecord()),
        findById: vi.fn(bindingRecord),
        findByState: vi.fn(() => []),
        confirm: vi.fn(() => true),
        updateLibraryAlbumId: vi.fn(),
        updateState: vi.fn(),
        delete: vi.fn(() => true),
    } as unknown as BindingRepository

    const coverService = {
        getCoverPath: vi.fn(() => null),
        getContentType: vi.fn(() => null),
        getMeta: vi.fn(() => ({
            resolutionStatus: "temporarily-unavailable",
            lastResolutionAt: "2026-07-16T12:00:00.000Z",
            candidateUrls: ["redacted", "redacted"],
        })),
        resolveRemoteCover: vi.fn(async () => ({ status: "cached" as const })),
        saveCover: vi.fn(),
        saveValidatedCover: vi.fn(async () => undefined),
        deleteCover: vi.fn(() => true),
    } as unknown as CoverService

    const scanRun = {
        id: ALBUM_ID,
        status: "completed",
        directories_scanned: 0,
        directories_skipped: 0,
    }
    const scanService = { runScan: vi.fn() } as unknown as ScanService
    const scanRunRepo = {
        findById: vi.fn(() => scanRun),
        findLatest: vi.fn(() => scanRun),
    } as unknown as ScanRunRepository

    const exportService = {
        createPreview: vi.fn(() => ({ exportId: ALBUM_ID, albumCount: 0 })),
        calculateDiff: vi.fn(() => ({ added: [], removed: [], unchanged: [] })),
        runStage: vi.fn(),
        runApply: vi.fn(() => ({ exportPath: "/rotation", archivePath: null })),
        getStageStatus: vi.fn(),
        listOperations: vi.fn(() => []),
        findOperation: vi.fn(),
    } as unknown as ExportService

    const backupScheduler = {
        getStatus: vi.fn(() => ({ enabled: true })),
        runManual: vi.fn(async () => ({ success: true })),
    } as unknown as BackupScheduler
    const backupStatusRepo = { getHistory: vi.fn(() => []) } as unknown as BackupStatusRepository
    const backupService = { listBackups: vi.fn(() => []) } as unknown as BackupService
    const musicGuard = ((relativePath: string) => `/music/${relativePath}`) as PathGuard
    const captureService = {
        capture: vi.fn(() => ({
            album: albumRepo.findById(ALBUM_ID),
            binding: bindingRecord(),
        })),
    } as unknown as BindingCaptureService

    const requireWriteToken = createRequireWriteToken(WRITE_TOKEN)
    const requireWriteTokenForMutations = createRequireWriteTokenForMutations(WRITE_TOKEN)
    const app = express()

    app.use("/covers", express.raw({ type: "*/*", limit: "5mb" }))
    app.use(express.json())
    app.use("/albums", requireWriteTokenForMutations, createAlbumsRouter(albumRepo))
    app.use("/covers", requireWriteTokenForMutations, createCoversRouter(coverService))
    app.use("/bindings", requireWriteTokenForMutations, createBindingsRouter(bindingRepo, musicGuard, captureService))
    app.use("/scan", requireSameOriginForMutations, createScanRouter(scanService, scanRunRepo, bindingRepo))
    app.use("/exports", requireWriteToken, createExportsRouter(exportService))
    app.use("/backups", requireWriteToken, createBackupsRouter(backupScheduler, backupStatusRepo, backupService))
    app.use(createApiErrorHandler())

    return {
        app,
        spies: {
            saveAlbum: albumRepo.save,
            deleteAlbum: albumRepo.delete,
            saveCover: coverService.saveValidatedCover,
            confirmBinding: bindingRepo.confirm,
            runScan: scanService.runScan,
            createPreview: exportService.createPreview,
            runBackup: backupScheduler.runManual,
        },
    }
}

async function closeServer(server: Server): Promise<void> {
    await new Promise<void>((resolve, reject) => {
        server.close((error) => error ? reject(error) : resolve())
    })
}

describe("mutating API route security", () => {
    const testApp = createTestApp()
    let server: Server
    let baseUrl: string

    beforeAll(async () => {
        await new Promise<void>((resolve, reject) => {
            server = testApp.app.listen(0, "127.0.0.1", () => {
                const address = server.address() as AddressInfo
                baseUrl = `http://127.0.0.1:${address.port}`
                resolve()
            })
            server.on("error", reject)
        })
    })

    afterAll(async () => {
        await closeServer(server)
    })

    async function request(route: RouteCase, token?: string): Promise<Response> {
        const headers: Record<string, string> = {}
        if (token) headers["x-rotation-write-token"] = token
        if (route.contentType) headers["content-type"] = route.contentType
        if (route.body !== undefined) headers["content-type"] = "application/json"

        return fetch(`${baseUrl}${route.path}`, {
            method: route.method,
            headers,
            body: route.rawBody
                ? new Uint8Array(route.rawBody)
                : (route.body === undefined ? undefined : JSON.stringify(route.body)),
        })
    }

    it.each(mutationRoutes)("rejects $name without a write token", async (route) => {
        const response = await request(route)

        expect(response.status).toBe(403)
        await expect(response.json()).resolves.toEqual({
            code: "INVALID_WRITE_TOKEN",
            error: "Forbidden: invalid or missing write token",
        })
    })

    it.each(mutationRoutes)("rejects $name with an invalid write token", async (route) => {
        const response = await request(route, "wrong-token")

        expect(response.status).toBe(403)
        await expect(response.json()).resolves.toEqual({
            code: "INVALID_WRITE_TOKEN",
            error: "Forbidden: invalid or missing write token",
        })
    })

    it.each(mutationRoutes)("allows $name with a valid write token", async (route) => {
        const response = await request(route, WRITE_TOKEN)

        expect(response.status).toBe(expectedAuthorizedStatus(route))
    })

    it.each([
        { name: "albums", route: mutationRoutes[0], status: 201, spy: testApp.spies.saveAlbum },
        { name: "covers", route: mutationRoutes[4], status: 201, spy: testApp.spies.saveCover },
        { name: "bindings", route: mutationRoutes[6], status: 200, spy: testApp.spies.confirmBinding },
        { name: "exports", route: mutationRoutes[12], status: 200, spy: testApp.spies.createPreview },
        { name: "backups", route: mutationRoutes[16], status: 200, spy: testApp.spies.runBackup },
    ])("allows an authorized $name mutation", async ({ route, status, spy }) => {
        const mockSpy = spy as unknown as { mock: { calls: unknown[][] } }
        const callsBefore = mockSpy.mock.calls.length

        const response = await request(route, WRITE_TOKEN)

        expect(response.status).toBe(status)
        expect(mockSpy.mock.calls).toHaveLength(callsBefore + 1)
    })

    it("keeps safe reads accessible without a token", async () => {
        const response = await fetch(`${baseUrl}/albums`)

        expect(response.status).toBe(200)
        await expect(response.json()).resolves.toEqual([])
    })

    it("exposes safe cover diagnostics without provider URLs or response bodies", async () => {
        const response = await fetch(`${baseUrl}/covers/${ALBUM_ID}/status`)

        expect(response.status).toBe(200)
        await expect(response.json()).resolves.toEqual({
            status: "temporarily-unavailable",
            lastResolutionAt: "2026-07-16T12:00:00.000Z",
            resolvedAt: null,
            candidateCount: 2,
            hasCachedCover: false,
            source: null,
            failureCode: null,
            sizeBytes: null,
            mimeType: null,
            width: null,
            height: null,
        })
    })

    it("allows a music scan without a write token", async () => {
        const runScan = testApp.spies.runScan as unknown as { mock: { calls: unknown[][] } }
        const callsBefore = runScan.mock.calls.length
        const response = await fetch(`${baseUrl}/scan`, { method: "POST" })

        expect(response.status).toBe(201)
        expect(runScan.mock.calls).toHaveLength(callsBefore + 1)
    })

    it("forwards one canonical album ID through album, cover, binding, export, and delete routes", async () => {
        await request(mutationRoutes[4], WRITE_TOKEN)
        await request(mutationRoutes[6], WRITE_TOKEN)
        await request({
            name: "canonical export",
            method: "POST",
            path: "/exports/preview",
            body: { albumIds: [ALBUM_ID], rotationPlanId: ALBUM_ID },
        }, WRITE_TOKEN)
        await request(mutationRoutes[2], WRITE_TOKEN)

        expect(testApp.spies.saveCover).toHaveBeenCalledWith(ALBUM_ID, expect.any(Buffer), "image/png", "upload")
        expect(testApp.spies.confirmBinding).toHaveBeenCalledWith(ALBUM_ID, "manual", expect.any(String))
        expect(testApp.spies.createPreview).toHaveBeenCalledWith([ALBUM_ID], ALBUM_ID)
        expect(testApp.spies.deleteAlbum).toHaveBeenCalledWith(ALBUM_ID)
    })

    it("returns a sanitized 400 response for malformed authorized JSON", async () => {
        const response = await fetch(`${baseUrl}/albums`, {
            method: "POST",
            headers: {
                "content-type": "application/json",
                "x-rotation-write-token": WRITE_TOKEN,
            },
            body: "{not-json",
        })

        expect(response.status).toBe(400)
        await expect(response.json()).resolves.toEqual({
            code: "INVALID_JSON",
            error: "Malformed JSON body",
        })
    })

    it.each([
        { name: "album UUID", method: "POST" as const, path: "/albums", body: { id: "bad", title: "Album", artist: "Artist" } },
        { name: "album role", method: "POST" as const, path: "/albums", body: { id: ALBUM_ID, title: "Album", artist: "Artist", category: "invalid" } },
        { name: "negative listen count", method: "POST" as const, path: "/albums", body: { id: ALBUM_ID, title: "Album", artist: "Artist", listenCount: -1 } },
        { name: "duplicate import IDs", method: "POST" as const, path: "/albums/import", body: { albums: [{ id: ALBUM_ID, title: "A", artist: "B" }, { id: ALBUM_ID, title: "A", artist: "B" }] } },
        { name: "binding target UUID", method: "POST" as const, path: "/bindings/link", body: { albumId: "Artist/Album", libraryAlbumId: "bad" } },
        { name: "duplicate export IDs", method: "POST" as const, path: "/exports/preview", body: { albumIds: [ALBUM_ID, ALBUM_ID] } },
        { name: "export UUID", method: "POST" as const, path: "/exports/apply", body: { exportId: "bad" } },
        { name: "cover UUID", method: "DELETE" as const, path: "/covers/not-a-uuid" },
    ])("returns structured validation errors for invalid $name", async ({ method, path, body }) => {
        const response = await request({ name: "invalid", method, path, body }, WRITE_TOKEN)

        expect(response.status).toBe(400)
        const result = await response.json() as { code: string; issues: unknown[] }
        expect(result.code).toBe("VALIDATION_ERROR")
        expect(result.issues.length).toBeGreaterThan(0)
    })
})
