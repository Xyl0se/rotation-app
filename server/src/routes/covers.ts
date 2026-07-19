import { Router } from "express"
import type { Request, Response } from "express"
import type { CoverService } from "../application/coverService.js"
import { CoverAlbumIdSchema, parseRequest } from "./validation.js"
import type { CoverResolver } from "../application/coverResolver.js"

const MAX_COVER_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB

export function createCoversRouter(coverService: CoverService, coverResolver?: CoverResolver): Router {
    const router = Router()

    router.post("/:albumId/resolve", async (req: Request, res: Response) => {
        const albumId = req.params.albumId as string
        if (!parseRequest(CoverAlbumIdSchema, { albumId }, res)) return
        if (!Buffer.isBuffer(req.body)) return void res.status(400).json({ error: "Expected cover source URL" })
        const body = req.body.toString("utf8")
        let sourceUrls: string | string[] = body
        if ((req.headers["content-type"] ?? "").includes("application/json")) {
            try {
                const parsed = JSON.parse(body) as { sourceUrls?: unknown; forceRefresh?: unknown }
                if (!Array.isArray(parsed.sourceUrls) || !parsed.sourceUrls.every(value => typeof value === "string")) {
                    return void res.status(400).json({ error: "Expected cover source URLs" })
                }
                if (parsed.forceRefresh !== undefined && typeof parsed.forceRefresh !== "boolean") {
                    return void res.status(400).json({ error: "Expected boolean forceRefresh" })
                }
                sourceUrls = parsed.sourceUrls
                res.locals.forceRefresh = parsed.forceRefresh === true
            } catch {
                return void res.status(400).json({ error: "Invalid cover resolution request" })
            }
        }
        const result = coverResolver
            ? await coverResolver.resolve(
                albumId,
                Array.isArray(sourceUrls) ? sourceUrls : [sourceUrls],
                res.locals.forceRefresh === true,
            )
            : await coverService.resolveRemoteCover(albumId, sourceUrls)
        res.status(result.status === "cached" ? 201 : 200).json(result)
    })

    router.get("/:albumId/status", (req: Request, res: Response) => {
        const albumId = req.params.albumId as string
        if (!parseRequest(CoverAlbumIdSchema, { albumId }, res)) return
        const meta = coverService.getMeta(albumId)
        res.json({
            status: meta?.resolutionStatus ?? (coverService.getCoverPath(albumId) ? "cached" : "not-found"),
            lastResolutionAt: meta?.lastResolutionAt ?? null,
            resolvedAt: meta?.resolvedAt ?? null,
            candidateCount: meta?.candidateUrls?.length ?? 0,
            hasCachedCover: coverService.getCoverPath(albumId) !== null,
            source: meta?.source === "url" ? "remote" : (meta?.source ?? null),
            failureCode: meta?.failureCode ?? null,
            sizeBytes: meta?.sizeBytes ?? null,
            mimeType: meta?.contentType ?? null,
            width: meta?.width ?? null,
            height: meta?.height ?? null,
        })
    })

    // GET /covers/:albumId — serve cover image
    router.get("/:albumId", (req: Request, res: Response) => {
        const albumId = req.params.albumId as string
        if (!parseRequest(CoverAlbumIdSchema, { albumId }, res)) return
        let coverPath: string | null
        try {
            coverPath = coverService.getCoverPath(albumId)
        } catch {
            res.status(400).json({ error: "Invalid album ID" })
            return
        }

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
    router.post("/:albumId", async (req: Request, res: Response) => {
        const albumId = req.params.albumId as string
        if (!parseRequest(CoverAlbumIdSchema, { albumId }, res)) return

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
            await coverService.saveValidatedCover(albumId, req.body, contentType, "upload")
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
        if (!parseRequest(CoverAlbumIdSchema, { albumId }, res)) return
        let deleted: boolean
        try {
            deleted = coverService.deleteCover(albumId)
        } catch {
            res.status(400).json({ error: "Invalid album ID" })
            return
        }
        if (!deleted) {
            res.status(404).json({ error: "Cover not found" })
            return
        }
        res.status(204).send()
    })

    return router
}
