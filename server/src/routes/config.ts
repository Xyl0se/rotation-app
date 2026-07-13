import { Router } from "express"
import type { Config } from "../application/config.js"

export function createConfigRouter(cfg: Config): Router {
    const router = Router()

    router.get("/", (_req, res) => {
        res.json({
            musicPath: cfg.ROTATION_MUSIC_PATH,
            workspacePath: cfg.ROTATION_WORKSPACE_PATH,
            syncthingRoot: cfg.ROTATION_SYNCTHING_ROOT,
        })
    })

    router.get("/auth", (_req, res) => {
        res.json({
            requiresWriteToken: true,
        })
    })

    return router
}
