import { createLogger } from "../infrastructure/logger/logger.js"
import type { AutomationSettingsRepository, AutomationSettingsUpdate, AutomationSettings } from "../infrastructure/persistence/sqlite/automationSettingsRepository.js"
import type { AutomationJobLogRepository } from "../infrastructure/persistence/sqlite/automationJobLogRepository.js"
import { createJobScheduler, buildCronExpression, type JobScheduler } from "./jobScheduler.js"
import { getNextRunAt, getLastRunAt } from "./timezoneHelper.js"

const log = createLogger("automation-service")

export interface JobHandlerRegistration {
    handler: (executionKey: string) => Promise<void>
    getExecutionKey: (forDate?: Date) => string
}

export interface AutomationService {
    start(): void
    stop(): void
    getSettings(): AutomationSettings & { nextRunAt: string | null }
    updateSettings(changes: AutomationSettingsUpdate): AutomationSettings & { nextRunAt: string | null }
    registerJobHandler(jobType: string, registration: JobHandlerRegistration): void
    executeNow(jobType: string): Promise<{ success: boolean; error?: string }>
    getJobStatus(jobType: string): {
        enabled: boolean
        nextRunAt: string | null
        lastRun: { startedAt: string; status: string; error?: string } | null
        lastSuccessfulRun: { startedAt: string } | null
        lastFailure: { startedAt: string; error: string } | null
        isRunning: boolean
    }
}

export function createAutomationService(
    settingsRepo: AutomationSettingsRepository,
    logRepo: AutomationJobLogRepository,
    scheduler: JobScheduler = createJobScheduler(),
): AutomationService {
    const handlers = new Map<string, JobHandlerRegistration>()
    const JOB_TYPE = "weekly-rotation"

    function buildNextRunAt(settings: AutomationSettings): string | null {
        const next = getNextRunAt(settings.weekday, settings.time, settings.timezone)
        return next?.toISOString() ?? null
    }

    function enrichSettings(settings: AutomationSettings): AutomationSettings & { nextRunAt: string | null } {
        return { ...settings, nextRunAt: buildNextRunAt(settings) }
    }

    function runWithClaim(jobType: string, handler: (key: string) => Promise<void>, getExecutionKey: (forDate?: Date) => string): Promise<void> {
        const key = getExecutionKey()
        const claim = logRepo.claimRun(jobType, key)
        if (!claim.claimed) {
            log.info(`Job skipped: already claimed`, { jobType, executionKey: key })
            return Promise.resolve()
        }

        return handler(key)
            .then(() => {
                logRepo.completeRun(claim.id!)
                log.info(`Job completed`, { jobType, executionKey: key })
            })
            .catch((err) => {
                const msg = err instanceof Error ? err.message : String(err)
                logRepo.failRun(claim.id!, msg)
                log.error(`Job failed`, { jobType, executionKey: key }, err)
            })
    }

    function createWrappedHandler(jobType: string): () => Promise<void> {
        return () => {
            const reg = handlers.get(jobType)
            if (!reg) {
                log.warn(`No handler registered for job type "${jobType}"`)
                return Promise.resolve()
            }
            return runWithClaim(jobType, reg.handler, reg.getExecutionKey)
        }
    }

    function performCatchUp(jobType: string, now: Date = new Date()): void {
        const settings = settingsRepo.findSettings()
        if (!settings.enabled || settings.grace_period_minutes === 0) return

        const lastScheduled = getLastRunAt(settings.weekday, settings.time, settings.timezone, now)
        if (!lastScheduled) return

        const elapsedMinutes = (now.getTime() - lastScheduled.getTime()) / 60_000
        if (elapsedMinutes > settings.grace_period_minutes) return

        const reg = handlers.get(jobType)
        if (!reg) return

        const key = reg.getExecutionKey(lastScheduled)
        const claim = logRepo.claimRun(jobType, key)
        if (!claim.claimed) return

        log.info(`Catch-up job executing`, { jobType, executionKey: key, missedAt: lastScheduled.toISOString() })

        reg.handler(key)
            .then(() => {
                logRepo.completeRun(claim.id!)
                log.info(`Catch-up job completed`, { jobType, executionKey: key })
            })
            .catch((err) => {
                const msg = err instanceof Error ? err.message : String(err)
                logRepo.failRun(claim.id!, msg)
                log.error(`Catch-up job failed`, { jobType, executionKey: key }, err)
            })
    }

    return {
        start() {
            const settings = settingsRepo.findSettings()
            if (!settings.enabled) {
                log.info("Automation is disabled; scheduler remains idle")
                return
            }

            const cron = buildCronExpression(settings.weekday, settings.time)
            const timezone = settings.timezone

            try {
                scheduler.register({
                    name: JOB_TYPE,
                    cronExpression: cron,
                    timezone,
                    handler: createWrappedHandler(JOB_TYPE),
                })
            } catch (err) {
                if (err instanceof Error && err.message.includes("already registered")) {
                    // Replan instead of re-registering
                    scheduler.replan(JOB_TYPE, cron, timezone)
                } else {
                    throw err
                }
            }

            scheduler.start()

            // Evaluate catch-up on startup
            performCatchUp(JOB_TYPE)
        },

        stop() {
            scheduler.stop()
            log.info("Automation scheduler stopped")
        },

        getSettings() {
            const settings = settingsRepo.findSettings()
            return enrichSettings(settings)
        },

        updateSettings(changes) {
            const wasEnabled = settingsRepo.findSettings().enabled
            const settings = settingsRepo.saveSettings(changes)
            const isEnabled = settings.enabled

            if (!wasEnabled && isEnabled) {
                // disabled -> enabled: start
                this.start()
            } else if (wasEnabled && !isEnabled) {
                // enabled -> disabled: stop
                scheduler.stop()
            } else if (isEnabled && (changes.weekday !== undefined || changes.time !== undefined || changes.timezone !== undefined)) {
                // Time config changed while enabled: replan
                const cron = buildCronExpression(settings.weekday, settings.time)
                scheduler.replan(JOB_TYPE, cron, settings.timezone)
            }

            return enrichSettings(settings)
        },

        registerJobHandler(jobType, registration) {
            handlers.set(jobType, registration)
            log.info(`Job handler registered`, { jobType })
        },

        executeNow(jobType) {
            const reg = handlers.get(jobType)
            if (!reg) {
                return Promise.resolve({ success: false, error: `No handler registered for job type "${jobType}"` })
            }

            const key = reg.getExecutionKey()
            const claim = logRepo.claimRun(jobType, key)
            if (!claim.claimed) {
                return Promise.resolve({ success: false, error: `Job already claimed for execution key: ${key}` })
            }

            return reg.handler(key)
                .then(() => {
                    logRepo.completeRun(claim.id!)
                    return { success: true }
                })
                .catch((err) => {
                    const msg = err instanceof Error ? err.message : String(err)
                    logRepo.failRun(claim.id!, msg)
                    return { success: false, error: msg }
                })
        },

        getJobStatus(jobType) {
            const settings = settingsRepo.findSettings()
            const latest = logRepo.findLatest(jobType)
            const latestCompleted = logRepo.findLatestCompleted(jobType)
            const latestFailed = logRepo.findLatestFailed(jobType)
            const running = logRepo.findRunning(jobType)

            const lastRun = latest
                ? {
                    startedAt: latest.started_at,
                    status: latest.status,
                    error: latest.error_message ?? undefined,
                }
                : null

            return {
                enabled: settings.enabled,
                nextRunAt: buildNextRunAt(settings),
                lastRun,
                lastSuccessfulRun: latestCompleted
                    ? { startedAt: latestCompleted.started_at }
                    : null,
                lastFailure: latestFailed
                    ? { startedAt: latestFailed.started_at, error: latestFailed.error_message ?? "Unknown error" }
                    : null,
                isRunning: running !== undefined,
            }
        },
    }
}