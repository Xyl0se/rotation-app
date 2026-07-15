import { Router } from "express"
import type { Request, Response } from "express"
import type { BindingRepository } from "../infrastructure/persistence/sqlite/bindingRepository.js"
import type { PathGuard } from "../infrastructure/filesystem/pathGuard.js"
import type { BindingCaptureService } from "../application/bindingCaptureService.js"
import { existsSync } from "node:fs"
import {
    BindingAlbumIdBodySchema,
    CaptureBindingBodySchema,
    DeleteBindingQuerySchema,
    LinkBindingBodySchema,
    parseRequest,
} from "./validation.js"

export interface BindingDTO {
    albumId: string
    relativePath: string
    state: string
    matchSource: string | null
    proposedAt: string | null
    confirmedAt: string | null
    libraryAlbumId: string | null
    folderExists: boolean
    libraryExists: boolean
    albumTitle?: string
    albumArtist?: string
    suggestedTitle?: string
    suggestedArtist?: string
}

function parseFolderName(relativePath: string): { artist: string; title: string } | null {
    // Expects "Artist / Album Title" or "Artist/Album Title"
    const normalized = relativePath.replace(/\\/g, "/")
    const parts = normalized.split("/").filter((p) => p.trim().length > 0)
    if (parts.length >= 2) {
        const artist = parts[parts.length - 2].trim()
        const title = parts[parts.length - 1].trim()
        if (artist && title) {
            return { artist, title }
        }
    }
    return null
}

function toDTO(
    record: ReturnType<BindingRepository["findWithAlbumDataById"]>,
    guard: PathGuard,
): BindingDTO | null {
    if (!record) return null
    let folderExists: boolean
    try {
        folderExists = existsSync(guard(record.relative_path))
    } catch {
        folderExists = false
    }
    const libraryExists = record.library_album_id !== null
    const parsed = !libraryExists ? parseFolderName(record.relative_path) : null
    return {
        albumId: record.album_id,
        relativePath: record.relative_path,
        state: record.state,
        matchSource: record.match_source,
        proposedAt: record.proposed_at,
        confirmedAt: record.confirmed_at,
        libraryAlbumId: record.library_album_id,
        folderExists,
        libraryExists,
        ...(libraryExists
            ? {
                  albumTitle: record.title ?? undefined,
                  albumArtist: record.artist ?? undefined,
              }
            : {}),
        ...(parsed
            ? {
                  suggestedTitle: parsed.title,
                  suggestedArtist: parsed.artist,
              }
            : {}),
    }
}

export function createBindingsRouter(
    bindingRepo: BindingRepository,
    musicGuard: PathGuard,
    captureService?: BindingCaptureService,
): Router {
    const router = Router()

    // GET /bindings – list all or filter by state or get single by albumId
    router.get("/", (req: Request, res: Response) => {
        const albumId = req.query.albumId as string | undefined
        const state = req.query.state as string | undefined

        if (albumId) {
            const record = bindingRepo.findWithAlbumDataById(albumId)
            if (!record) {
                res.status(404).json({ error: "Binding not found" })
                return
            }
            res.json(toDTO(record, musicGuard))
            return
        }

        const records = state
            ? bindingRepo.findWithAlbumDataByState(state as "unbound" | "proposed" | "confirmed" | "missing")
            : bindingRepo.findWithAlbumData()
        const dtos = records
            .map((r) => toDTO(r, musicGuard))
            .filter((dto): dto is BindingDTO => dto !== null)
        res.json({ bindings: dtos, count: dtos.length })
    })

    // GET /bindings/orphans – bindings without a matching library album
    router.get("/orphans", (_req: Request, res: Response) => {
        const records = bindingRepo.findOrphans()
        const dtos = records
            .map((r) => toDTO(r, musicGuard))
            .filter((dto): dto is BindingDTO => dto !== null)
        res.json({ bindings: dtos, count: dtos.length })
    })

    // GET /bindings/by-library-album/:libraryAlbumId – find binding by library album UUID
    router.get("/by-library-album/:libraryAlbumId", (req: Request, res: Response) => {
        const libraryAlbumId = req.params.libraryAlbumId as string
        const record = bindingRepo.findByLibraryAlbumId(libraryAlbumId)
        if (!record) {
            res.status(404).json({ error: "Binding not found" })
            return
        }
        const fullRecord = bindingRepo.findWithAlbumDataById(record.album_id)
        res.json(toDTO(fullRecord, musicGuard))
    })

    // POST /bindings/confirm – confirm a binding by albumId
    router.post("/confirm", (req: Request, res: Response) => {
        const body = parseRequest(BindingAlbumIdBodySchema, req.body, res)
        if (!body) return
        const { albumId } = body
        const record = bindingRepo.findById(albumId)
        if (!record) {
            res.status(404).json({ error: "Binding not found" })
            return
        }
        const ok = bindingRepo.confirm(albumId, "manual", new Date().toISOString())
        if (!ok) {
            res.status(500).json({ error: "Failed to confirm binding" })
            return
        }
        const updated = bindingRepo.findWithAlbumDataById(albumId)!
        res.json(toDTO(updated, musicGuard))
    })

    // POST /bindings/link – manually link a binding to a library album
    router.post("/link", (req: Request, res: Response) => {
        const body = parseRequest(LinkBindingBodySchema, req.body, res)
        if (!body) return
        const { albumId, libraryAlbumId } = body
        const record = bindingRepo.findById(albumId)
        if (!record) {
            res.status(404).json({ error: "Binding not found" })
            return
        }
        try {
            bindingRepo.updateLibraryAlbumId(albumId, libraryAlbumId)
        } catch {
            res.status(400).json({
                code: "VALIDATION_ERROR",
                error: "Invalid request",
                issues: [{ path: "libraryAlbumId", message: "Library album does not exist" }],
            })
            return
        }
        const updated = bindingRepo.findWithAlbumDataById(albumId)!
        res.json(toDTO(updated, musicGuard))
    })

    // POST /bindings/capture – atomically create one Library Album and link its Binding
    router.post("/capture", (req: Request, res: Response) => {
        if (!captureService) {
            res.status(501).json({ error: "Binding capture is unavailable" })
            return
        }
        const body = parseRequest(CaptureBindingBodySchema, req.body, res)
        if (!body) return
        try {
            const result = captureService.capture(body.albumId, {
                ...body.album,
                year: body.album.year ?? "",
                roleHistory: body.album.roleHistory ?? [],
                listenCount: body.album.listenCount ?? 0,
                lastListened: body.album.lastListened ?? null,
            })
            res.status(201).json({
                album: result.album,
                binding: toDTO(result.binding, musicGuard),
            })
        } catch (error) {
            const code = error instanceof Error ? error.message : "CAPTURE_FAILED"
            if (code === "BINDING_NOT_FOUND") {
                res.status(404).json({ error: "Binding not found" })
                return
            }
            if (code === "ALBUM_ID_CONFLICT" || code === "BINDING_ALREADY_LINKED") {
                res.status(409).json({ error: code })
                return
            }
            res.status(500).json({ error: "Binding capture failed" })
        }
    })

    // POST /bindings/unlink – remove library album link from a binding
    router.post("/unlink", (req: Request, res: Response) => {
        const body = parseRequest(BindingAlbumIdBodySchema, req.body, res)
        if (!body) return
        const { albumId } = body
        const record = bindingRepo.findById(albumId)
        if (!record) {
            res.status(404).json({ error: "Binding not found" })
            return
        }
        bindingRepo.updateLibraryAlbumId(albumId, null)
        const updated = bindingRepo.findWithAlbumDataById(albumId)!
        res.json(toDTO(updated, musicGuard))
    })

    // POST /bindings/verify – check confirmed bindings against filesystem
    router.post("/verify", (_req: Request, res: Response) => {
        const confirmed = bindingRepo.findByState("confirmed")
        const ok: string[] = []
        const missing: string[] = []

        for (const b of confirmed) {
            if (existsSync(musicGuard(b.relative_path))) {
                ok.push(b.album_id)
            } else {
                missing.push(b.album_id)
                bindingRepo.updateState(b.album_id, "missing")
            }
        }

        res.json({ okCount: ok.length, missingCount: missing.length, missingIds: missing })
    })

    // POST /bindings/reconcile – batch promote proposed → confirmed for existing folders
    router.post("/reconcile", (_req: Request, res: Response) => {
        const proposed = bindingRepo.findByState("proposed")
        const promoted: string[] = []

        for (const b of proposed) {
            if (existsSync(musicGuard(b.relative_path))) {
                bindingRepo.confirm(b.album_id, "scan-exact", new Date().toISOString())
                promoted.push(b.album_id)
            }
        }

        res.json({ promotedCount: promoted.length, promotedIds: promoted })
    })

    // DELETE /bindings?albumId=... – delete a binding
    router.delete("/", (req: Request, res: Response) => {
        const query = parseRequest(DeleteBindingQuerySchema, req.query, res)
        if (!query) return
        const { albumId } = query
        const record = bindingRepo.findById(albumId)
        if (!record) {
            res.status(404).json({ error: "Binding not found" })
            return
        }
        const ok = bindingRepo.delete(albumId)
        if (!ok) {
            res.status(500).json({ error: "Failed to delete binding" })
            return
        }
        res.status(204).send()
    })

    return router
}
