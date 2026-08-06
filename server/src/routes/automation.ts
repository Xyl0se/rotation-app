import { Router } from "express"
import { z } from "zod"
import type { AutomationService } from "../application/automationService.js"
import type { RotationStateRepository } from "../infrastructure/persistence/sqlite/rotationStateRepository.js"
import { getCurrentISOWeek } from "../application/timezoneHelper.js"

const settingsUpdateSchema = z.object({
    enabled: z.boolean().optional(),
    weekday: z.number().int().min(0).max(6).optional(),
    time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
    timezone: z.string().min(1).optional(),
    email_recipient: z.string().email().nullable().optional(),
    email_enabled: z.boolean().optional(),
    auto_export_enabled: z.boolean().optional(),
    grace_period_minutes: z.number().int().min(0).optional(),
})

export function createAutomationRouter(
    automationService: AutomationService,
    requireWriteTokenForMutations: (req: import("express").Request, res: import("express").Response, next: import("express").NextFunction) => void,
    rotationRepo?: RotationStateRepository,
) {
    const router = Router()

    /**
     * GET /automation/settings
     */
    router.get("/settings", (_req, res) => {
        try {
            const settings = automationService.getSettings()
            res.json(settings)
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err)
            res.status(500).json({ error: message })
        }
    })

    /**
     * PATCH /automation/settings
     */
    router.patch("/settings", requireWriteTokenForMutations, (req, res) => {
        const parseResult = settingsUpdateSchema.safeParse(req.body)
        if (!parseResult.success) {
            res.status(400).json({
                error: "Validation failed",
                details: parseResult.error.issues,
            })
            return
        }

        try {
            const updated = automationService.updateSettings(parseResult.data)
            res.json(updated)
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err)
            res.status(500).json({ error: message })
        }
    })

    /**
     * POST /automation/jobs/:type/run
     */
    router.post("/jobs/:type/run", requireWriteTokenForMutations, async (req, res) => {
        const jobType = req.params.type as string
        const result = await automationService.executeNow(jobType)

        if (result.success) {
            res.status(202).json({ success: true })
        } else {
            res.status(409).json({ success: false, error: result.error })
        }
    })

    /**
     * GET /automation/jobs/:type/status
     */
    router.get("/jobs/:type/status", (req, res) => {
        const jobType = req.params.type as string
        const status = automationService.getJobStatus(jobType)

        // For weekly-rotation, add currentWeekRotation flag
        if (jobType === "weekly-rotation" && rotationRepo) {
            const active = rotationRepo.findActive()
            const currentWeek = getCurrentISOWeek()
            const isCurrentWeek = active?.automationExecutionKey === currentWeek || active?.generationSource === "automation"
            res.json({ ...status, currentWeekRotation: isCurrentWeek })
            return
        }

        res.json(status)
    })

    return router
}