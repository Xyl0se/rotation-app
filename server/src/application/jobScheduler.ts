import { schedule, validate } from "node-cron"
import { createLogger } from "../infrastructure/logger/logger.js"

const schedulerLog = createLogger("job-scheduler")

export interface JobDefinition {
    name: string
    cronExpression: string
    timezone: string
    handler: () => Promise<void>
}

export interface JobScheduler {
    register(job: JobDefinition): void
    start(): void
    stop(): void
    replan(name: string, newCronExpression: string, timezone?: string): void
    executeNow(name: string): Promise<{ success: boolean; error?: string }>
    getStatus(name: string): {
        registered: boolean
        cronExpression: string | null
        timezone: string | null
    }
}

interface InternalJob {
    definition: JobDefinition
    task: ReturnType<typeof schedule> | null
}

export function createJobScheduler(): JobScheduler {
    const jobs = new Map<string, InternalJob>()
    let started = false

    function executeJob(name: string, trigger: "cron" | "manual"): Promise<{ success: boolean; error?: string }> {
        const internal = jobs.get(name)
        if (!internal) {
            return Promise.resolve({ success: false, error: `Job "${name}" is not registered` })
        }

        return internal.definition.handler()
            .then(() => {
                schedulerLog.info(`Job executed successfully`, { job: name, trigger })
                return { success: true }
            })
            .catch((err) => {
                const message = err instanceof Error ? err.message : String(err)
                schedulerLog.error(`Job execution failed`, { job: name, trigger }, err)
                return { success: false, error: message }
            })
    }

    function scheduleTask(internal: InternalJob): void {
        if (!validate(internal.definition.cronExpression)) {
            throw new Error(`Invalid cron expression: ${internal.definition.cronExpression}`)
        }

        internal.task = schedule(
            internal.definition.cronExpression,
            () => {
                void executeJob(internal.definition.name, "cron")
            },
            {
                timezone: internal.definition.timezone,
            },
        )
    }

    return {
        register(job) {
            if (jobs.has(job.name)) {
                throw new Error(`Job "${job.name}" is already registered`)
            }
            if (!validate(job.cronExpression)) {
                throw new Error(`Invalid cron expression for job "${job.name}": ${job.cronExpression}`)
            }

            jobs.set(job.name, {
                definition: job,
                task: null,
            })
            schedulerLog.info(`Job registered`, { job: job.name, cron: job.cronExpression, timezone: job.timezone })
        },

        start() {
            if (started) return
            for (const [, internal] of jobs) {
                if (!internal.task) {
                    scheduleTask(internal)
                }
            }
            started = true
            schedulerLog.info("Job scheduler started")
        },

        stop() {
            for (const [, internal] of jobs) {
                if (internal.task) {
                    internal.task.stop()
                    internal.task = null
                }
            }
            started = false
            schedulerLog.info("Job scheduler stopped")
        },

        replan(name, newCronExpression, newTimezone) {
            const internal = jobs.get(name)
            if (!internal) {
                throw new Error(`Cannot replan unknown job "${name}"`)
            }
            if (!validate(newCronExpression)) {
                throw new Error(`Invalid cron expression: ${newCronExpression}`)
            }

            if (internal.task) {
                internal.task.stop()
                internal.task = null
            }

            internal.definition.cronExpression = newCronExpression
            if (newTimezone) {
                internal.definition.timezone = newTimezone
            }

            if (started) {
                scheduleTask(internal)
            }

            schedulerLog.info(`Job replanned`, {
                job: name,
                cron: newCronExpression,
                timezone: internal.definition.timezone,
            })
        },

        executeNow(name) {
            return executeJob(name, "manual")
        },

        getStatus(name) {
            const internal = jobs.get(name)
            if (!internal) {
                return { registered: false, cronExpression: null, timezone: null }
            }

            return {
                registered: true,
                cronExpression: internal.definition.cronExpression,
                timezone: internal.definition.timezone,
            }
        },
    }
}

export function buildCronExpression(weekday: number, time: string): string {
    const [hour, minute] = time.split(":")
    return `${minute} ${hour} * * ${weekday}`
}