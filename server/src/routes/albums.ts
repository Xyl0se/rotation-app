import { Router } from "express"
import type { Request, Response } from "express"
import type { AlbumRepository } from "../infrastructure/persistence/sqlite/albumRepository.js"
import type { Album } from "../domain/albumTypes.js"
import {
    CreateAlbumSchema,
    ImportAlbumsSchema,
    UpdateAlbumSchema,
    UUIDSchema,
    parseRequest,
} from "./validation.js"

export interface ImportResult {
    imported: number
    updated: number
    failed: number
}

export function createAlbumsRouter(albumRepo: AlbumRepository): Router {
    const router = Router()

    // GET /albums — list all albums
    router.get("/", (_req: Request, res: Response) => {
        const albums = albumRepo.findAll()
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
    router.post("/", (req: Request, res: Response) => {
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

        const album: Album = {
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
        }

        albumRepo.save(album)
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
        }

        albumRepo.save(album)
        res.json(album)
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
            }

            parsedAlbums.push(album)
            if (existing) updated++
            else imported++
        }

        try {
            albumRepo.saveMany(parsedAlbums)
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
