import { randomInt } from "node:crypto"
import { Router } from "express"
import type { RotationStateRepository } from "../infrastructure/persistence/sqlite/rotationStateRepository.js"
import { FocusAlbumSchema, ListenEventSchema, RotationLegacyImportSchema, RotationPlanSchema, parseRequest } from "./validation.js"
import type { RotationPlan } from "../domain/rotationTypes.js"

function canonicalPlan(plan: Omit<RotationPlan, "focusAlbumId"> & { focusAlbumId?: string | null }): RotationPlan {
    return { ...plan, focusAlbumId: plan.focusAlbumId ?? null }
}

export function createRotationStateRouter(repository: RotationStateRepository): Router {
    const router = Router()
    router.get("/", (_req, res) => res.json({ active: repository.findActive(), draft: repository.findDraft() }))
    router.put("/plan", (req, res) => {
        const plan = parseRequest(RotationPlanSchema, req.body, res)
        if (!plan) return
        try { repository.savePlan(canonicalPlan(plan)); res.json(plan.status === "active" ? repository.findActive() : repository.findDraft()) }
        catch (error) { res.status(409).json({ error: error instanceof Error ? error.message : "ROTATION_CONFLICT" }) }
    })
    router.put("/focus", (req, res) => {
        const body = parseRequest(FocusAlbumSchema, req.body, res)
        if (!body) return
        try { res.json(repository.setFocus(body.albumId)) }
        catch (error) { res.status(409).json({ error: error instanceof Error ? error.message : "FOCUS_CONFLICT" }) }
    })
    router.post("/focus/random", (_req, res) => {
        const active = repository.findActive()
        if (!active?.albumIds.length) return void res.status(409).json({ error: "NO_ACTIVE_ROTATION" })
        res.json(repository.setFocus(active.albumIds[randomInt(active.albumIds.length)]!))
    })
    router.get("/listens", (_req, res) => res.json(repository.findListenEvents()))
    router.post("/listens", (req, res) => {
        const event = parseRequest(ListenEventSchema, req.body, res)
        if (!event) return
        try { repository.saveListenEvent(event); res.status(201).json(event) }
        catch { res.status(409).json({ error: "ALBUM_NOT_FOUND" }) }
    })
    router.post("/legacy-import", (req, res) => {
        const body = parseRequest(RotationLegacyImportSchema, req.body, res)
        if (!body) return
        try {
            repository.importLegacy(
                body.draft ? canonicalPlan(body.draft) : null,
                body.active ? canonicalPlan(body.active) : null,
                body.listenEvents ?? [],
            )
            res.json({ active: repository.findActive(), draft: repository.findDraft(), listenEvents: repository.findListenEvents() })
        } catch (error) { res.status(409).json({ error: error instanceof Error ? error.message : "IMPORT_CONFLICT" }) }
    })
    return router
}
