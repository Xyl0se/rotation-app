import { createLogger } from "../infrastructure/logger/logger.js"
import type { AutomationSettingsRepository } from "../infrastructure/persistence/sqlite/automationSettingsRepository.js"
import { getCurrentISOWeek } from "./timezoneHelper.js"
import type { RotationGenerationService } from "./rotationGenerationService.js"
import type { AutomatedExportService } from "./automatedExportService.js"

const log = createLogger("weekly-rotation-job")

export interface WeeklyRotationJob {
    handler: (executionKey: string) => Promise<void>
    getExecutionKey: (forDate?: Date) => string
}

export function createWeeklyRotationJob(
    rotationGenerationService: RotationGenerationService,
    automatedExportService: AutomatedExportService,
    automationSettingsRepo: AutomationSettingsRepository,
): WeeklyRotationJob {
    return {
        getExecutionKey(forDate = new Date()) {
            return getCurrentISOWeek(forDate)
        },

        async handler(executionKey: string) {
            const settings = automationSettingsRepo.findSettings()

            // 1. Generate rotation (in-memory only)
            const plan = rotationGenerationService.generateRotation({
                executionKey,
            })

            // 2. Optional: auto-export
            if (settings.auto_export_enabled) {
                try {
                    await automatedExportService.runHeadlessExport(plan.albumIds)
                } catch (exportErr) {
                    // Export failed → don't activate rotation
                    // The automationService will log this as failed
                    log.error("Auto-export failed; rotation not activated", { executionKey }, exportErr)
                    throw exportErr
                }
            }

            // 3. Activate rotation (only after successful export or if export is skipped)
            rotationGenerationService.activateRotation(plan)

            log.info("Weekly rotation completed", { executionKey, planId: plan.id })
        },
    }
}