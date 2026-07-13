import { Router } from "express"
import type { Request, Response } from "express"
import type Database from "better-sqlite3"
import { accessSync, constants, existsSync, mkdtempSync, rmSync } from "node:fs"
import { join } from "node:path"
import type { ScanRunRepository } from "../infrastructure/persistence/sqlite/scanRunRepository.js"
import type { Config } from "../application/config.js"
import { getGlobalMetricsStore } from "../infrastructure/metrics/metrics.js"

interface HealthCheck {
    status: "ok" | "fail"
    responseMs?: number
    detail?: string
}

interface HealthResponse {
    status: "ok" | "degraded"
    checks: {
        db: HealthCheck
        musicReadable: HealthCheck
        dataWritable: HealthCheck
        syncthingWritable: HealthCheck
    }
    lastScan: {
        id: string | null
        status: string | null
        finishedAt: string | null
        albumFoldersFound: number
    } | null
    metrics: Record<string, unknown>
}

export function createHealthRouter(
    db: Database.Database,
    config: Config,
    scanRunRepo: ScanRunRepository,
): Router {
    const router = Router()

    router.get("/", (_req: Request, res: Response) => {
        const checks: HealthResponse["checks"] = {
            db: checkDb(db),
            musicReadable: checkMusicReadable(config.ROTATION_MUSIC_PATH),
            dataWritable: checkDataWritable(config.ROTATION_WORKSPACE_PATH),
            syncthingWritable: checkDataWritable(config.ROTATION_SYNCTHING_ROOT),
        }

        const allOk = Object.values(checks).every((c) => c.status === "ok")
        const responseStatus: "ok" | "degraded" = allOk ? "ok" : "degraded"

        const lastScan = scanRunRepo.findLatest()

        const body: HealthResponse = {
            status: responseStatus,
            checks,
            lastScan: lastScan
                ? {
                    id: lastScan.id,
                    status: lastScan.status,
                    finishedAt: lastScan.finished_at,
                    albumFoldersFound: lastScan.album_folders_found,
                }
                : null,
            metrics: getGlobalMetricsStore().exportJson(),
        }

        res.status(allOk ? 200 : 503).json(body)
    })

    return router
}

function checkDb(db: Database.Database): HealthCheck {
    const start = Date.now()
    try {
        db.prepare("SELECT 1").get()
        return { status: "ok", responseMs: Date.now() - start }
    } catch (err) {
        return {
            status: "fail",
            responseMs: Date.now() - start,
            detail: err instanceof Error ? err.message : String(err),
        }
    }
}

function checkMusicReadable(path: string): HealthCheck {
    try {
        if (!existsSync(path)) {
            return { status: "fail", detail: "Path does not exist" }
        }
        accessSync(path, constants.R_OK)
        return { status: "ok" }
    } catch (err) {
        return {
            status: "fail",
            detail: err instanceof Error ? err.message : String(err),
        }
    }
}

function checkDataWritable(path: string): HealthCheck {
    try {
        if (!existsSync(path)) {
            return { status: "fail", detail: "Path does not exist" }
        }
        // Attempt to create and remove a temp directory
        const tmpDir = mkdtempSync(join(path, ".health-check-"))
        rmSync(tmpDir, { recursive: true, force: true })
        return { status: "ok" }
    } catch (err) {
        return {
            status: "fail",
            detail: err instanceof Error ? err.message : String(err),
        }
    }
}
