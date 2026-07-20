import { Router } from "express"
import type { Request, Response } from "express"
import type { PlaybackManifestService } from "../application/playbackManifestService.js"

export function createPlaybackRouter(playbackManifestService: PlaybackManifestService): Router {
    const router = Router()

    router.get("/manifest/:albumId", async (req: Request, res: Response) => {
        const albumId = req.params.albumId as string
        const result = await playbackManifestService.getManifest(albumId)

        if ("code" in result) {
            switch (result.code) {
                case "not-found":
                    res.status(404).json({ error: "Album or binding not found" })
                    return
                case "not-confirmed":
                    res.status(404).json({ error: "Album or binding not found" })
                    return
                case "ambiguous-order":
                    res.status(503).json({
                        error: "Album has ambiguous track ordering",
                        diagnostic: result.diagnostic,
                    })
                    return
            }
        }

        res.json(result.manifest)
    })

    return router
}