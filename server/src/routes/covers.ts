import { Router } from "express"
import type { Request, Response } from "express"
import type { CoverService } from "../application/coverService.js"

const MAX_COVER_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB

export function createCoversRouter(coverService: CoverService): Router {
    const router = Router()

    // GET /covers/:albumId — serve cover image
    router.get("/:albumId", (req: Request, res: Response) => {
        const albumId = req.params.albumId as string
        const coverPath = coverService.getCoverPath(albumId)

        if (!coverPath) {
            res.status(404).json({ error: "Cover not found" })
            return
        }

        const contentType = coverService.getContentType(albumId)
        if (contentType) {
            res.setHeader("Content-Type", contentType)
        }
        res.sendFile(coverPath)
    })

    // POST /covers/:albumId — upload cover
    router.post("/:albumId", (req: Request, res: Response) => {
        const albumId = req.params.albumId as string

        // Express raw body handler should be configured for this route
        // We'll handle the raw buffer directly
        if (!Buffer.isBuffer(req.body)) {
            res.status(400).json({ error: "Expected raw binary body" })
            return
        }

        if (req.body.length > MAX_COVER_SIZE_BYTES) {
            res.status(413).json({
                error: `Cover exceeds maximum size of ${MAX_COVER_SIZE_BYTES} bytes`,
            })
            return
        }

        const contentType = req.headers["content-type"] || "image/jpeg"

        try {
            coverService.saveCover(albumId, req.body, contentType, "upload")
            res.status(201).json({ success: true })
        } catch (err) {
            res.status(400).json({
                error: err instanceof Error ? err.message : "Failed to save cover",
            })
        }
    })

    // DELETE /covers/:albumId — delete cover
    router.delete("/:albumId", (req: Request, res: Response) => {
        const albumId = req.params.albumId as string
        const deleted = coverService.deleteCover(albumId)
        if (!deleted) {
            res.status(404).json({ error: "Cover not found" })
            return
        }
        res.status(204).send()
    })

    return router
}
