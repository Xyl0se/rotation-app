import { randomInt, randomUUID } from "node:crypto"
import { Router } from "express"
import type { RotationStateRepository } from "../infrastructure/persistence/sqlite/rotationStateRepository.js"
import { FocusAlbumSchema, ListenEventSchema, RotationPlanSchema, RotationSettingsSchema, parseRequest } from "./validation.js"
import type { RotationPlan } from "../domain/rotationTypes.js"
import type { BindingRepository } from "../infrastructure/persistence/sqlite/bindingRepository.js"
import type { PathGuard } from "../infrastructure/filesystem/pathGuard.js"
import { previewExport } from "../domain/export/exportEngine.js"
import type { AuditRepository } from "../infrastructure/persistence/sqlite/auditRepository.js"

function canonicalPlan(plan: Omit<RotationPlan, "focusAlbumId"> & { focusAlbumId?: string | null }): RotationPlan {
    return { ...plan, focusAlbumId: plan.focusAlbumId ?? null }
}

export function createRotationStateRouter(repository: RotationStateRepository, bindings?: BindingRepository, musicGuard?: PathGuard, audit?: AuditRepository): Router {
    const router = Router()
    router.get("/", (_req, res) => res.json({ active: repository.findActive(), draft: repository.findDraft() }))
    router.get("/history", (req, res) => {
        const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100)
        const offset = Math.max(Number(req.query.offset) || 0, 0)
        res.json({ ...repository.findHistory(limit, offset), limit, offset })
    })
    router.post("/history/:id/draft", (req,res) => {
        try { res.status(201).json(repository.createDraftFromArchived(req.params.id as string, randomUUID(), new Date().toISOString())) }
        catch(error){ res.status(409).json({error:error instanceof Error?error.message:"HISTORY_CONFLICT"}) }
    })
    router.get("/handover", (_req, res) => {
        const draft = repository.findDraft()
        const active = repository.findActive()
        if (!draft) return void res.status(409).json({ error: "NO_DRAFT_ROTATION" })
        if (!bindings || !musicGuard) return void res.status(503).json({ error: "HANDOVER_PREVIEW_UNAVAILABLE" })

        try {
            const bindingMap = new Map(bindings.findAll()
                .filter(binding => binding.library_album_id)
                .map(binding => [binding.library_album_id!, binding]))
            const readiness = previewExport(randomUUID(), draft.albumIds, bindingMap, musicGuard)
            const countRoles = (plan: RotationPlan | null) => Object.fromEntries(
                ["new", "comfort-food", "classic", "growing"].map(role => [
                    role,
                    plan?.items.filter(item => item.role === role).length ?? 0,
                ]),
            )
            const beforeRoles = countRoles(active)
            const afterRoles = countRoles(draft)
            const quotaGaps = Object.fromEntries(draft.roleQuotas.map(quota => [
                quota.role,
                Math.max(0, quota.targetCount - (afterRoles[quota.role] ?? 0)),
            ]))

            res.json({
                draftId: draft.id,
                activeId: active?.id ?? null,
                entering: draft.albumIds.filter(id => !active?.albumIds.includes(id)),
                leaving: (active?.albumIds ?? []).filter(id => !draft.albumIds.includes(id)),
                unchanged: draft.albumIds.filter(id => active?.albumIds.includes(id)),
                beforeRoles,
                afterRoles,
                quotaGaps,
                size: draft.items.length,
                targetSize: draft.targetSize,
                missingBindings: readiness.missingBindings,
                unconfirmedBindings: readiness.unconfirmedBindings,
                estimatedSizeBytes: readiness.totalSizeBytes,
                fileCount: readiness.fileCount,
                exportReady: readiness.canExport,
            })
        } catch {
            res.status(409).json({ error: "HANDOVER_FILESYSTEM_UNAVAILABLE" })
        }
    })
    router.get("/settings", (_req, res) => res.json(repository.findSettings()))
    router.put("/settings", (req, res) => {
        const settings = parseRequest(RotationSettingsSchema, req.body, res)
        if (settings) res.json(repository.saveSettings(settings))
    })
    router.put("/plan", (req, res) => {
        const plan = parseRequest(RotationPlanSchema, req.body, res)
        if (!plan) return
        try {
            const previousDraft = repository.findDraft()
            repository.savePlan(canonicalPlan(plan))
            if (audit && previousDraft && plan.status === "draft") {
                const removed = previousDraft.albumIds.filter(id => !plan.albumIds.includes(id))
                const added = plan.albumIds.filter(id => !previousDraft.albumIds.includes(id))
                if (removed.length === 1 && added.length === 1) {
                    audit.record("draft-item-replaced", plan.id, { albumId: removed[0] }, { albumId: added[0] })
                } else {
                    for (const albumId of removed) audit.record("draft-item-removed", plan.id, { albumId }, null)
                }
            }
            if (audit && plan.status === "active" && previousDraft?.id === plan.id) {
                audit.record("rotation-accepted", plan.id, { status: "draft" }, { status: "active", albumIds: plan.albumIds })
            }
            res.json(plan.status === "active" ? repository.findActive() : repository.findDraft())
        }
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
    router.get("/listens", (req, res) => {
        const limit = Math.min(Math.max(Number(req.query.limit) || 1_000, 1), 5_000)
        const offset = Math.max(Number(req.query.offset) || 0, 0)
        res.json(repository.findListenEvents(limit, offset))
    })
    router.post("/listens", (req, res) => {
        const event = parseRequest(ListenEventSchema, req.body, res)
        if (!event) return
        try { repository.saveListenEvent(event); res.status(201).json(event) }
        catch { res.status(409).json({ error: "ALBUM_NOT_FOUND" }) }
    })
    return router
}
