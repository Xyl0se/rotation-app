import { afterEach, describe, expect, it } from "vitest"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import sharp from "sharp"
import { createCoverService } from "../../../application/coverService.js"
import { initDatabase } from "./connection.js"
import { createCoverResolutionRepository } from "./coverResolutionRepository.js"

const ALBUM_ID = "550e8400-e29b-41d4-a716-446655440000"
const directories: string[] = []

afterEach(() => {
    for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true })
})

describe("cover resolution persistence", () => {
    it("retains successful resolution diagnostics across a database and service restart", async () => {
        const directory = mkdtempSync(join(tmpdir(), "rotation-cover-persistence-"))
        directories.push(directory)
        const databasePath = join(directory, "rotation.db")
        const firstDatabase = initDatabase(databasePath)
        firstDatabase.prepare("INSERT INTO albums (id,title,artist,role_history,listen_count,created_at,updated_at) VALUES (?,?,?,?,?,?,?)")
            .run(ALBUM_ID, "Album", "Artist", "[]", 0, "created", "updated")
        const firstService = createCoverService(directory, createCoverResolutionRepository(firstDatabase))
        const image = await sharp({ create: { width: 12, height: 8, channels: 3, background: "blue" } }).png().toBuffer()
        await firstService.saveValidatedCover(ALBUM_ID, image, "image/png", "folder")
        firstDatabase.close()

        const restartedDatabase = initDatabase(databasePath)
        const restartedService = createCoverService(directory, createCoverResolutionRepository(restartedDatabase))
        expect(restartedService.getMeta(ALBUM_ID)).toMatchObject({
            source: "folder",
            resolutionStatus: "cached",
            resolvedAt: expect.any(String),
            sizeBytes: image.length,
            contentType: "image/png",
            width: 12,
            height: 8,
            sourceFingerprint: expect.stringMatching(/^[a-f0-9]{64}$/),
        })
        expect(restartedService.getCoverPath(ALBUM_ID)).not.toBeNull()
        restartedDatabase.close()
    })
})
