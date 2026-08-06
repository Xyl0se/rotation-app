import { randomUUID } from "node:crypto"
import Database from "better-sqlite3"

export interface AutomationJobLogRecord {
    id: string
    job_type: string
    execution_key: string
    status: "started" | "completed" | "failed"
    scheduled_for: string | null
    started_at: string
    finished_at: string | null
    error_message: string | null
    result_reference: string | null
    created_at: string
}

export interface AutomationJobLogClaimResult {
    claimed: boolean
    id: string | null
}

export function createAutomationJobLogRepository(db: Database.Database) {
    const insertClaim = db.prepare<[
        string, // id
        string, // job_type
        string, // execution_key
        string, // started_at
        string, // created_at
    ]>(`
        INSERT INTO automation_job_log (id, job_type, execution_key, status, started_at, created_at)
        VALUES (?, ?, ?, 'started', ?, ?)
    `)

    const updateCompletion = db.prepare<[
        string, // status
        string, // finished_at
        string | null, // error_message
        string | null, // result_reference
        string, // id
    ]>(`
        UPDATE automation_job_log
        SET status = ?,
            finished_at = ?,
            error_message = ?,
            result_reference = ?
        WHERE id = ?
    `)

    const findByExecutionKey = db.prepare<[
        string, // job_type
        string, // execution_key
    ]>(`
        SELECT * FROM automation_job_log
        WHERE job_type = ? AND execution_key = ?
    `)

    const findLatest = db.prepare<[
        string, // job_type
    ]>(`
        SELECT * FROM automation_job_log
        WHERE job_type = ?
        ORDER BY started_at DESC
        LIMIT 1
    `)

    const findLatestCompleted = db.prepare<[
        string, // job_type
    ]>(`
        SELECT * FROM automation_job_log
        WHERE job_type = ? AND status = 'completed'
        ORDER BY started_at DESC
        LIMIT 1
    `)

    const findLatestFailed = db.prepare<[
        string, // job_type
    ]>(`
        SELECT * FROM automation_job_log
        WHERE job_type = ? AND status = 'failed'
        ORDER BY started_at DESC
        LIMIT 1
    `)

    const findRunning = db.prepare<[
        string, // job_type
    ]>(`
        SELECT * FROM automation_job_log
        WHERE job_type = ? AND status = 'started' AND finished_at IS NULL
        ORDER BY started_at DESC
        LIMIT 1
    `)

    return {
        /**
         * Atomically attempts to claim a job run by inserting a 'started' row.
         * If the unique constraint on (job_type, execution_key) fails, another
         * run already exists — the job must not execute.
         */
        claimRun(jobType: string, executionKey: string): AutomationJobLogClaimResult {
            const id = randomUUID()
            const now = new Date().toISOString()
            try {
                insertClaim.run(id, jobType, executionKey, now, now)
                return { claimed: true, id }
            } catch (err) {
                if (err instanceof Error && err.message.includes("UNIQUE constraint failed")) {
                    return { claimed: false, id: null }
                }
                throw err
            }
        },

        completeRun(id: string, resultReference: string | null = null): void {
            updateCompletion.run("completed", new Date().toISOString(), null, resultReference, id)
        },

        failRun(id: string, errorMessage: string): void {
            updateCompletion.run("failed", new Date().toISOString(), errorMessage, null, id)
        },

        findByExecutionKey(jobType: string, executionKey: string): AutomationJobLogRecord | undefined {
            return findByExecutionKey.get(jobType, executionKey) as AutomationJobLogRecord | undefined
        },

        findLatest(jobType: string): AutomationJobLogRecord | undefined {
            return findLatest.get(jobType) as AutomationJobLogRecord | undefined
        },

        findLatestCompleted(jobType: string): AutomationJobLogRecord | undefined {
            return findLatestCompleted.get(jobType) as AutomationJobLogRecord | undefined
        },

        findLatestFailed(jobType: string): AutomationJobLogRecord | undefined {
            return findLatestFailed.get(jobType) as AutomationJobLogRecord | undefined
        },

        findRunning(jobType: string): AutomationJobLogRecord | undefined {
            return findRunning.get(jobType) as AutomationJobLogRecord | undefined
        },
    }
}

export type AutomationJobLogRepository = ReturnType<typeof createAutomationJobLogRepository>