import { Router } from "express"
import type { Request, Response } from "express"
import type { PlaybackManifestService } from "../application/playbackManifestService.js"
import type { PlaybackMediaService } from "../application/playbackMediaService.js"

export function createPlaybackRouter(
    playbackManifestService: PlaybackManifestService,
    playbackMediaService?: PlaybackMediaService,
): Router {
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

    // --- Media delivery (Workstream 89C) ---
    if (playbackMediaService) {
        const mediaHandler = (req: Request, res: Response) => {
            const albumId = req.params.albumId as string
            const opaqueTrackId = req.params.opaqueTrackId as string
            const isHead = req.method === "HEAD"
            const rangeHeader = req.headers.range as string | undefined

            const result = playbackMediaService.streamMedia(albumId, opaqueTrackId, rangeHeader)

            if ("body" in result) {
                res.status(result.status).json(result.body)
                return
            }

            // Security headers
            res.set({
                "X-Content-Type-Options": "nosniff",
                "Content-Security-Policy": "default-src 'none'",
                ...result.headers,
            })

            if (isHead) {
                res.status(result.status).end()
                return
            }

            if (result.stream) {
                // Pipe stream with backpressure; close file handle on abort/close
                const stream = result.stream
                res.status(result.status)
                stream.pipe(res)
                req.on("close", () => {
                    if ("destroy" in stream && typeof stream.destroy === "function") {
                        stream.destroy()
                    }
                })
                req.on("aborted", () => {
                    if ("destroy" in stream && typeof stream.destroy === "function") {
                        stream.destroy()
                    }
                })
                stream.on("error", () => {
                    if (!res.writableEnded) {
                        res.destroy()
                    }
                })
            } else {
                res.status(result.status).end()
            }
        }

        router.head("/media/:albumId/:opaqueTrackId", mediaHandler)
        router.get("/media/:albumId/:opaqueTrackId", mediaHandler)
    }

    return router
}