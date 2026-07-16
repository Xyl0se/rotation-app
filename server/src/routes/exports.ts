import { Router } from "express"
import type { Request, Response } from "express"
import type { ExportService } from "../application/exportService.js"
import { getAndClearLastRecoveryResult } from "../application/crashRecovery.js"
import {
    ApplyExportSchema,
    ExportAlbumIdsSchema,
    StageExportSchema,
    parseRequest,
} from "./validation.js"

export function createExportsRouter(exportService: ExportService): Router {
    const router = Router()

    router.post("/preview", (req: Request, res: Response) => {
        const body = parseRequest(ExportAlbumIdsSchema, req.body, res)
        if (!body) return
        const { albumIds, rotationPlanId } = body
        try {
            const result = exportService.createPreview(albumIds, rotationPlanId)
            res.json(result)
        } catch (err) {
            res.status(500).json({
                error: "Preview failed",
                message: err instanceof Error ? err.message : String(err),
            })
        }
    })

    router.post("/diff", (req: Request, res: Response) => {
        const body = parseRequest(ExportAlbumIdsSchema, req.body, res)
        if (!body) return
        const { albumIds } = body
        try {
            const diff = exportService.calculateDiff(albumIds)
            res.json(diff)
        } catch (err) {
            res.status(500).json({
                error: "Diff calculation failed",
                message: err instanceof Error ? err.message : String(err),
            })
        }
    })

    router.post("/stage", (req: Request, res: Response) => {
        const body = parseRequest(StageExportSchema, req.body, res)
        if (!body) return
        const { exportId, albumIds, rotationPlanId } = body
        try {
            exportService.runStage(exportId, albumIds, rotationPlanId)
            res.status(202).json({ exportId, status: "staging" })
        } catch (err) {
            res.status(500).json({
                error: "Stage failed",
                message: err instanceof Error ? err.message : String(err),
            })
        }
    })

    router.get("/:id/status", (req: Request, res: Response) => {
        const progress = exportService.getStageStatus(req.params.id as string)
        if (!progress) {
            res.status(404).json({ error: "Export not found" })
            return
        }
        res.json(progress)
    })

    router.post("/apply", (req: Request, res: Response) => {
        const body = parseRequest(ApplyExportSchema, req.body, res)
        if (!body) return
        const { exportId } = body
        try {
            const result = exportService.runApply(exportId)
            res.json({ exportId, status: "applied", ...result })
        } catch (err) {
            res.status(500).json({
                error: "Apply failed",
                message: err instanceof Error ? err.message : String(err),
            })
        }
    })

    router.get("/startup-recovery", (_req: Request, res: Response) => {
        const result = getAndClearLastRecoveryResult()
        res.json(result ?? { recovered: 0, cleanedStagingDirs: 0, cleanedArchives: 0 })
    })

    router.get("/", (_req: Request, res: Response) => {
        res.json({ operations: exportService.listOperations() })
    })

    router.get("/:id", (req: Request, res: Response) => {
        const op = exportService.findOperation(req.params.id as string)
        if (!op) {
            res.status(404).json({ error: "Export not found" })
            return
        }
        res.json(op)
    })

    return router
}
