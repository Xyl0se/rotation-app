import { Router } from "express"
import type { Request, Response } from "express"
import { randomUUID } from "node:crypto"
import type { AlbumRepository } from "../infrastructure/persistence/sqlite/albumRepository.js"
import type { Album } from "../domain/albumTypes.js"

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
        const body = req.body as Partial<Album>

        if (!body.title || !body.artist) {
            res.status(400).json({ error: "title and artist are required" })
            return
        }

        const album: Album = {
            id: randomUUID(),
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
        const existing = albumRepo.findById(id)
        if (!existing) {
            res.status(404).json({ error: "Album not found" })
            return
        }

        const body = req.body as Partial<Album>

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
        const { albums } = req.body as { albums?: unknown[] }

        if (!Array.isArray(albums)) {
            res.status(400).json({ error: "albums array is required" })
            return
        }

        let imported = 0
        let updated = 0
        let failed = 0

        for (const raw of albums) {
            if (typeof raw !== "object" || raw === null) {
                failed++
                continue
            }
            const body = raw as Partial<Album>

            if (!body.id || !body.title || !body.artist) {
                failed++
                continue
            }

            const existing = albumRepo.findById(body.id as string)

            const album: Album = {
                id: body.id as string,
                title: body.title as string,
                artist: body.artist as string,
                year: (body.year as string) ?? "",
                coverUrl: body.coverUrl as string | undefined,
                coverOverride: body.coverOverride as Album["coverOverride"],
                category: body.category as Album["category"],
                roleHistory: (body.roleHistory as Album["roleHistory"]) ?? [],
                listenCount: (body.listenCount as number) ?? 0,
                lastListened: (body.lastListened as string | null) ?? null,
                story: body.story as Album["story"],
            }

            try {
                albumRepo.save(album)
                if (existing) {
                    updated++
                } else {
                    imported++
                }
            } catch {
                failed++
            }
        }

        res.json({ imported, updated, failed } satisfies ImportResult)
    })

    return router
}
