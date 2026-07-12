import { Router } from "express"
import type { Request, Response } from "express"
import type { BindingRepository } from "../infrastructure/persistence/sqlite/bindingRepository.js"
import type { PathGuard } from "../infrastructure/filesystem/pathGuard.js"
import { existsSync } from "node:fs"

export interface BindingDTO {
    albumId: string
    relativePath: string
    state: string
    matchSource: string | null
    proposedAt: string | null
    confirmedAt: string | null
    folderExists: boolean
}

function toDTO(record: ReturnType<BindingRepository["findById"]>, guard: PathGuard): BindingDTO | null {
    if (!record) return null
    let folderExists = false
    try {
        folderExists = existsSync(guard(record.relative_path))
    } catch {
        folderExists = false
    }
    return {
        albumId: record.album_id,
        relativePath: record.relative_path,
        state: record.state,
        matchSource: record.match_source,
        proposedAt: record.proposed_at,
        confirmedAt: record.confirmed_at,
        folderExists,
    }
}

export function createBindingsRouter(bindingRepo: BindingRepository, musicGuard: PathGuard): Router {
    const router = Router()

    // GET /bindings – list all or filter by state or get single by albumId
    router.get("/", (req: Request, res: Response) => {
        const albumId = req.query.albumId as string | undefined
        const state = req.query.state as string | undefined

        if (albumId) {
            const record = bindingRepo.findById(albumId)
            if (!record) {
                res.status(404).json({ error: "Binding not found" })
                return
            }
            res.json(toDTO(record, musicGuard))
            return
        }

        const records = state
            ? bindingRepo.findByState(state as "unbound" | "proposed" | "confirmed" | "missing")
            : bindingRepo.findAll()
        const dtos = records
            .map((r) => toDTO(r, musicGuard))
            .filter((dto): dto is BindingDTO => dto !== null)
        res.json({ bindings: dtos, count: dtos.length })
    })

    // POST /bindings/confirm – confirm a binding by albumId
    router.post("/confirm", (req: Request, res: Response) => {
        const albumId = req.body.albumId as string | undefined
        if (!albumId) {
            res.status(400).json({ error: "albumId is required" })
            return
        }
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
        const updated = bindingRepo.findById(albumId)!
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
        const albumId = req.query.albumId as string | undefined
        if (!albumId) {
            res.status(400).json({ error: "albumId query parameter is required" })
            return
        }
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
