import { Router } from "express"
import type { Request, Response } from "express"
import type { AlbumRepository } from "../infrastructure/persistence/sqlite/albumRepository.js"
import type { Album } from "../domain/albumTypes.js"
import type { AuditRepository } from "../infrastructure/persistence/sqlite/auditRepository.js"
import {
    CreateAlbumSchema,
    AlbumSourcePreviewSchema,
    AlbumSourcesUpdateSchema,
    ImportAlbumsSchema,
    UpdateAlbumSchema,
    UUIDSchema,
    parseRequest,
} from "./validation.js"
import type { AlbumSource } from "../domain/albumTypes.js"
import { createLogger } from "../infrastructure/logger/logger.js"
import type { MusicBrainzReleaseCandidate } from "../application/externalSourceResolver.js"

const log = createLogger("album-sources")

export interface ImportResult {
    imported: number
    updated: number
    failed: number
}

export function createAlbumsRouter(
    albumRepo: AlbumRepository,
    auditRepo?: AuditRepository,
    onRelevantEvent?: () => void,
    onCreatedAlbum?: (albumId: string, remoteUrls: string[]) => void,
    resolveExternalSources?: (releaseId: string, releaseGroupId?: string) => Promise<AlbumSource[]>,
    searchMusicBrainzReleases?: (title: string, artist: string) => Promise<MusicBrainzReleaseCandidate[]>,
): Router {
    const router = Router()

    // GET /albums — list all albums
    router.get("/", (req: Request, res: Response) => {
        const limit = Math.min(Math.max(Number(req.query.limit) || 10_000, 1), 10_000)
        const offset = Math.max(Number(req.query.offset) || 0, 0)
        const albums = albumRepo.findAll(limit, offset)
        res.json(albums)
    })

    // GET /albums/:id — single album
    router.get("/:id", (req: Request, res: Response) => {
        const id = req.params.id as string
        const album = albumRepo.findById(id)
        if (!album) {
            res.status(404).json({ error: "Album not found" })
            return
        }
        res.json(album)
    })

    // POST /albums — create album
    router.post("/", async (req: Request, res: Response) => {
        const body = parseRequest(CreateAlbumSchema, req.body, res)
        if (!body) return
        const id = body.id
        const existing = albumRepo.findById(id)
        if (existing) {
            if (existing.title === body.title && existing.artist === body.artist) {
                res.status(200).json(existing)
                return
            }
            res.status(409).json({ error: "Album ID already exists" })
            return
        }

        let album: Album = {
            id,
            title: body.title,
            artist: body.artist,
            year: body.year ?? "",
            coverUrl: body.coverUrl,
            coverOverride: body.coverOverride,
            category: body.category,
            roleHistory: body.roleHistory ?? [],
            listenCount: body.listenCount ?? 0,
            lastListened: body.lastListened ?? null,
            story: body.story,
            sources: body.sources ?? [],
        }

        albumRepo.save(album)
        onRelevantEvent?.()
        onCreatedAlbum?.(album.id, body.coverCandidates ?? [])
        const release = album.sources?.find(source => source.provider === "musicbrainz" && source.url?.includes("/release/"))
        const releaseGroup = album.sources?.find(source => source.provider === "musicbrainz" && source.url?.includes("/release-group/"))
        if (release?.externalId && resolveExternalSources) {
            try {
                const enrichedSources = await resolveExternalSources(release.externalId, releaseGroup?.externalId)
                if (enrichedSources.length > 0) {
                    album = { ...album, sources: [...(album.sources ?? []), ...enrichedSources] }
                    albumRepo.save(album)
                }
            } catch (error) {
                log.warn("External source enrichment failed; Album capture continues", {
                    albumId: album.id,
                    error: error instanceof Error ? error.message : String(error),
                })
            }
        }
        res.status(201).json(album)
    })

    // PUT /albums/:id — update album (full replace)
    router.put("/:id", (req: Request, res: Response) => {
        const id = req.params.id as string
        if (!parseRequest(UUIDSchema, id, res)) return
        const existing = albumRepo.findById(id)
        if (!existing) {
            res.status(404).json({ error: "Album not found" })
            return
        }

        const body = parseRequest(UpdateAlbumSchema, req.body, res)
        if (!body) return
        if (body.coverOverride && body.coverOverride.albumId !== id) {
            res.status(400).json({
                code: "VALIDATION_ERROR",
                error: "Invalid request",
                issues: [{
                    path: "coverOverride.albumId",
                    message: "Cover override albumId must match album id",
                }],
            })
            return
        }

        const album: Album = {
            id,
            title: body.title ?? existing.title,
            artist: body.artist ?? existing.artist,
            year: body.year ?? existing.year,
            coverUrl: body.coverUrl ?? existing.coverUrl,
            coverOverride: body.coverOverride ?? existing.coverOverride,
            category: body.category ?? existing.category,
            roleHistory: body.roleHistory ?? existing.roleHistory,
            listenCount: body.listenCount ?? existing.listenCount,
            lastListened: body.lastListened ?? existing.lastListened,
            story: body.story ?? existing.story,
            sources: existing.sources,
        }

        if (auditRepo) auditRepo.saveAlbumWithAudit(existing, album)
        else albumRepo.save(album)
        onRelevantEvent?.()
        res.json(album)
    })

    router.post("/:id/sources/search", async (req: Request, res: Response) => {
        const id = req.params.id as string
        if (!parseRequest(UUIDSchema, id, res)) return
        const album = albumRepo.findById(id)
        if (!album) { res.status(404).json({ error: "Album not found" }); return }
        if (!searchMusicBrainzReleases) { res.status(503).json({ error: "Source search unavailable" }); return }
        try {
            res.json({ candidates: await searchMusicBrainzReleases(album.title, album.artist) })
        } catch (error) {
            log.warn("External source search failed", { albumId: id, error: error instanceof Error ? error.message : String(error) })
            res.status(502).json({ error: "External source search failed" })
        }
    })

    router.post("/:id/sources/preview", async (req: Request, res: Response) => {
        const id = req.params.id as string
        if (!parseRequest(UUIDSchema, id, res)) return
        if (!albumRepo.exists(id)) { res.status(404).json({ error: "Album not found" }); return }
        const selection = parseRequest(AlbumSourcePreviewSchema, req.body, res)
        if (!selection) return
        if (!resolveExternalSources) { res.status(503).json({ error: "Source resolution unavailable" }); return }
        try {
            const now = new Date().toISOString()
            const sources: AlbumSource[] = [{ provider: "musicbrainz", externalId: selection.releaseId, url: `https://musicbrainz.org/release/${selection.releaseId}`, resolutionStatus: "resolved", resolvedAt: now, confirmedByUser: false }]
            if (selection.releaseGroupId) sources.push({ provider: "musicbrainz", externalId: selection.releaseGroupId, url: `https://musicbrainz.org/release-group/${selection.releaseGroupId}`, resolutionStatus: "resolved", resolvedAt: now, confirmedByUser: false })
            res.json({ sources: [...sources, ...await resolveExternalSources(selection.releaseId, selection.releaseGroupId)] })
        } catch (error) {
            log.warn("External source preview failed", { albumId: id, error: error instanceof Error ? error.message : String(error) })
            res.status(502).json({ error: "External source preview failed" })
        }
    })

    router.put("/:id/sources", (req: Request, res: Response) => {
        const id = req.params.id as string
        if (!parseRequest(UUIDSchema, id, res)) return
        const album = albumRepo.findById(id)
        if (!album) { res.status(404).json({ error: "Album not found" }); return }
        const body = parseRequest(AlbumSourcesUpdateSchema, req.body, res)
        if (!body) return
        const updated: Album = { ...album, sources: body.sources.map(source => ({ ...source, confirmedByUser: true })) }
        albumRepo.save(updated)
        res.json(updated)
    })

    // DELETE /albums/:id — delete album
    router.delete("/:id", (req: Request, res: Response) => {
        const id = req.params.id as string
        if (!parseRequest(UUIDSchema, id, res)) return
        const existing = albumRepo.findById(id)
        if (!existing) {
            res.status(404).json({ error: "Album not found" })
            return
        }
        albumRepo.delete(id)
        onRelevantEvent?.()
        res.status(204).send()
    })

    // POST /albums/import — batch import (upsert)
    router.post("/import", (req: Request, res: Response) => {
        const parsed = parseRequest(ImportAlbumsSchema, req.body, res)
        if (!parsed) return
        const { albums } = parsed

        let imported = 0
        let updated = 0
        const parsedAlbums: Album[] = []

        for (const body of albums) {
            const existing = albumRepo.findById(body.id)

            const album: Album = {
                id: body.id,
                title: body.title,
                artist: body.artist,
                year: body.year ?? "",
                coverUrl: body.coverUrl,
                coverOverride: body.coverOverride,
                category: body.category,
                roleHistory: body.roleHistory ?? [],
                listenCount: body.listenCount ?? 0,
                lastListened: body.lastListened ?? null,
                story: body.story,
                sources: body.sources ?? existing?.sources ?? [],
            }

            parsedAlbums.push(album)
            if (existing) updated++
            else imported++
        }

        try {
            albumRepo.saveMany(parsedAlbums)
            onRelevantEvent?.()
            res.json({ imported, updated, failed: 0 } satisfies ImportResult)
        } catch {
            res.status(500).json({
                error: "Album import failed; no albums were changed",
                imported: 0,
                updated: 0,
                failed: parsedAlbums.length,
            })
        }
    })

    return router
}
