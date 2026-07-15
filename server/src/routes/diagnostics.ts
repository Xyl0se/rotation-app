import { Router } from "express"
import type { Request, Response } from "express"
import { accessSync, constants, existsSync } from "node:fs"
import type { BindingRepository } from "../infrastructure/persistence/sqlite/bindingRepository.js"
import type { ScanRunRepository } from "../infrastructure/persistence/sqlite/scanRunRepository.js"
import type { PathGuard } from "../infrastructure/filesystem/pathGuard.js"
import { createDirectoryScanner } from "../infrastructure/filesystem/directoryScanner.js"
import type { Config } from "../application/config.js"

export interface DiagnosticsResponse {
    connectivity: {
        api: boolean
        database: boolean
    }
    filesystem: {
        musicPath: {
            configured: string
            exists: boolean
            readable: boolean
            albumFoldersFound: number
        }
        workspacePath: {
            configured: string
            exists: boolean
            writable: boolean
        }
        syncthingRoot: {
            configured: string
            exists: boolean
            writable: boolean
        }
    }
    bindings: {
        total: number
        proposed: number
        confirmed: number
        missing: number
        lastScanAt: string | null
        lastScanStatus: string | null
        lastScanAlbumFoldersFound: number
    }
    rotation: {
        hasActivePlan: boolean
    }
}

function checkAccess(path: string, mode: number): boolean {
    try {
        accessSync(path, mode)
        return true
    } catch {
        return false
    }
}

export function createDiagnosticsRouter(
    config: Config,
    bindingRepo: BindingRepository,
    scanRunRepo: ScanRunRepository,
    musicGuard: PathGuard,
    _workspaceGuard: PathGuard,
    _syncthingGuard: PathGuard,
): Router {
    void _workspaceGuard
    void _syncthingGuard
    const router = Router()
    const scanner = createDirectoryScanner(musicGuard)

    router.get("/", (_req: Request, res: Response) => {
        let databaseOk: boolean
        try {
            bindingRepo.findAll()
            databaseOk = true
        } catch {
            databaseOk = false
        }

        let albumFoldersFound = 0
        if (existsSync(config.ROTATION_MUSIC_PATH)) {
            try {
                const result = scanner()
                albumFoldersFound = result.albumFolders.length
            } catch {
                albumFoldersFound = 0
            }
        }

        const lastScan = scanRunRepo.findLatest()
        const allBindings = bindingRepo.findAll()

        const response: DiagnosticsResponse = {
            connectivity: {
                api: true,
                database: databaseOk,
            },
            filesystem: {
                musicPath: {
                    configured: config.ROTATION_MUSIC_PATH,
                    exists: existsSync(config.ROTATION_MUSIC_PATH),
                    readable: checkAccess(config.ROTATION_MUSIC_PATH, constants.R_OK),
                    albumFoldersFound,
                },
                workspacePath: {
                    configured: config.ROTATION_WORKSPACE_PATH,
                    exists: existsSync(config.ROTATION_WORKSPACE_PATH),
                    writable: checkAccess(config.ROTATION_WORKSPACE_PATH, constants.W_OK),
                },
                syncthingRoot: {
                    configured: config.ROTATION_SYNCTHING_ROOT,
                    exists: existsSync(config.ROTATION_SYNCTHING_ROOT),
                    writable: checkAccess(config.ROTATION_SYNCTHING_ROOT, constants.W_OK),
                },
            },
            bindings: {
                total: allBindings.length,
                proposed: allBindings.filter((b) => b.state === "proposed").length,
                confirmed: allBindings.filter((b) => b.state === "confirmed").length,
                missing: allBindings.filter((b) => b.state === "missing").length,
                lastScanAt: lastScan?.started_at ?? null,
                lastScanStatus: lastScan?.status ?? null,
                lastScanAlbumFoldersFound: lastScan?.album_folders_found ?? 0,
            },
            rotation: {
                hasActivePlan: false, // Will be enhanced when rotation plan API is available
            },
        }

        res.json(response)
    })

    return router
}
