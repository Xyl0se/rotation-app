import { Router } from "express"
import type { Request, Response } from "express"
import type { ExportService } from "../application/exportService.js"

export function createExportsRouter(exportService: ExportService): Router {
    const router = Router()

    router.post("/preview", (req: Request, res: Response) => {
        const { albumIds } = req.body as { albumIds?: string[] }
        if (!Array.isArray(albumIds)) {
            res.status(400).json({ error: "albumIds must be an array" })
            return
        }
        try {
            const result = exportService.createPreview(albumIds)
            res.json(result)
        } catch (err) {
            res.status(500).json({
                error: "Preview failed",
                message: err instanceof Error ? err.message : String(err),
            })
        }
    })

    router.post("/diff", (req: Request, res: Response) => {
        const { albumIds } = req.body as { albumIds?: string[] }
        if (!Array.isArray(albumIds)) {
            res.status(400).json({ error: "albumIds must be an array" })
            return
        }
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
        const { exportId, albumIds } = req.body as { exportId?: string; albumIds?: string[] }
        if (!exportId || !Array.isArray(albumIds)) {
            res.status(400).json({ error: "exportId and albumIds are required" })
            return
        }
        try {
            exportService.runStage(exportId, albumIds)
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
        const { exportId } = req.body as { exportId?: string }
        if (!exportId) {
            res.status(400).json({ error: "exportId is required" })
            return
        }
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
