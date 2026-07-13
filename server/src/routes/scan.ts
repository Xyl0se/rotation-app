import { Router } from "express"
import type { Request, Response } from "express"
import type { ScanService } from "../application/scanService.js"
import type { ScanRunRepository } from "../infrastructure/persistence/sqlite/scanRunRepository.js"
import type { BindingRepository } from "../infrastructure/persistence/sqlite/bindingRepository.js"
import { randomUUID } from "node:crypto"

export function createScanRouter(
    scanService: ScanService,
    scanRunRepo: ScanRunRepository,
    bindingRepo: BindingRepository,
): Router {
    const router = Router()

    router.post("/", (_req: Request, res: Response) => {
        const scanId = randomUUID()

        try {
            scanService.runScan(scanId)
            const scanRun = scanRunRepo.findById(scanId)
            res.status(201).json({ scanId, status: scanRun?.status ?? "unknown" })
        } catch (err) {
            res.status(500).json({
                error: "Scan failed",
                message: err instanceof Error ? err.message : String(err),
            })
        }
    })

    router.get("/latest", (_req: Request, res: Response) => {
        const scanRun = scanRunRepo.findLatest()
        if (!scanRun) {
            res.status(404).json({ error: "No scan runs found" })
            return
        }
        res.json(scanRun)
    })

    router.get("/results", (_req: Request, res: Response) => {
        const scanRun = scanRunRepo.findLatest()
        if (!scanRun) {
            res.status(404).json({ error: "No scan runs found" })
            return
        }

        const bindings = bindingRepo.findByState("proposed")
        res.json({
            scanRun,
            proposedBindings: bindings,
            count: bindings.length,
        })
    })

    router.get("/:scanId/progress", (req: Request, res: Response) => {
        const scanId = req.params.scanId as string
        const scanRun = scanRunRepo.findById(scanId)
        if (!scanRun) {
            res.status(404).json({ error: "Scan not found" })
            return
        }
        res.json({
            scanId: scanRun.id,
            directoriesScanned: scanRun.directories_scanned,
            directoriesSkipped: scanRun.directories_skipped,
            status: scanRun.status,
        })
    })

    return router
}
