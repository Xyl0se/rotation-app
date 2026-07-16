import { describe, expect, it } from "vitest"
import { initDatabase } from "./connection.js"
import { createBindingCandidateRepository } from "./bindingCandidateRepository.js"

function seed(db: ReturnType<typeof initDatabase>) {
    db.prepare(`INSERT INTO albums (id,title,artist,role_history,listen_count,created_at,updated_at) VALUES (?,?,?,'[]',0,?,?)`)
        .run("11111111-1111-4111-8111-111111111111", "Album", "Artist", "2026-01-01", "2026-01-01")
    db.prepare(`INSERT INTO bindings (album_id,relative_path,state,proposed_at) VALUES (?,?,'proposed',?)`)
        .run("Artist/Album folder", "Artist/Album folder", "2026-01-01")
    db.prepare(`INSERT INTO scan_runs VALUES (?, ?, ?, 1, 0, 1, 'completed', NULL)`)
        .run("22222222-2222-4222-8222-222222222222", "2026-01-01", "2026-01-01")
}

describe("binding candidate repository", () => {
    it("persists reasons and selects a current candidate atomically", () => {
        const db = initDatabase(":memory:")
        seed(db)
        const repository = createBindingCandidateRepository(db)
        repository.replaceForBinding("Artist/Album folder", "22222222-2222-4222-8222-222222222222", [{
            libraryAlbumId: "11111111-1111-4111-8111-111111111111",
            title: "Album",
            artist: "Artist",
            score: .9,
            confidence: "strong",
            reasons: ["title-similar", "artist-exact"],
        }])
        expect(repository.findByBinding("Artist/Album folder")[0]?.reasons).toEqual(["title-similar", "artist-exact"])
        expect(repository.selectCandidate(
            "Artist/Album folder",
            "11111111-1111-4111-8111-111111111111",
            "33333333-3333-4333-8333-333333333333",
            "2026-01-02",
        )).toBe("STALE_SCAN")
        expect(db.prepare("SELECT state FROM bindings").get()).toEqual({ state: "proposed" })
        expect(repository.selectCandidate(
            "Artist/Album folder",
            "11111111-1111-4111-8111-111111111111",
            "22222222-2222-4222-8222-222222222222",
            "2026-01-02",
        )).toBe("SELECTED")
        expect(db.prepare("SELECT state, library_album_id FROM bindings").get()).toEqual({
            state: "confirmed",
            library_album_id: "11111111-1111-4111-8111-111111111111",
        })
        expect(repository.findByBinding("Artist/Album folder")).toEqual([])
        db.close()
    })
})
