import { describe, expect, it } from "vitest"
import { initDatabase } from "./connection.js"
import { createCoverResolutionRepository } from "./coverResolutionRepository.js"

const ALBUM_ID = "550e8400-e29b-41d4-a716-446655440000"

function setup() {
    const db = initDatabase(":memory:")
    db.prepare("INSERT INTO albums (id,title,artist,role_history,listen_count,created_at,updated_at) VALUES (?,?,?,?,?,?,?)")
        .run(ALBUM_ID, "Album", "Artist", "[]", 0, "created", "updated")
    return { db, repository: createCoverResolutionRepository(db) }
}

describe("cover resolution repository", () => {
    it("stores successful source and bounded image diagnostics", () => {
        const { db, repository } = setup()
        repository.recordSuccess({
            albumId: ALBUM_ID,
            source: "folder",
            attemptedAt: "attempt",
            resolvedAt: "resolved",
            fingerprint: "fingerprint",
            sizeBytes: 123,
            mimeType: "image/png",
            width: 20,
            height: 10,
        })
        expect(repository.findByAlbumId(ALBUM_ID)).toMatchObject({
            source_type: "folder",
            status: "cached",
            resolved_at: "resolved",
            source_fingerprint: "fingerprint",
            size_bytes: 123,
            width: 20,
            height: 10,
        })
        db.close()
    })

    it("records a failed retry without erasing last known-good source metadata", () => {
        const { db, repository } = setup()
        repository.recordSuccess({
            albumId: ALBUM_ID, source: "upload", attemptedAt: "first", resolvedAt: "first",
            sizeBytes: 123, mimeType: "image/png", width: 20, height: 10,
        })
        repository.recordFailure(ALBUM_ID, "invalid-image", "second", "invalid-image")
        expect(repository.findByAlbumId(ALBUM_ID)).toMatchObject({
            source_type: "upload",
            status: "cached",
            last_attempt_at: "second",
            resolved_at: "first",
            size_bytes: 123,
            failure_code: "invalid-image",
        })
        db.close()
    })
})
