import { describe, expect, it } from "vitest"
import { initDatabase } from "./connection.js"
import { createRotationStateRepository } from "./rotationStateRepository.js"
import type { RotationPlan } from "../../../domain/rotationTypes.js"

const A = "11111111-1111-4111-8111-111111111111"
const B = "22222222-2222-4222-8222-222222222222"

function setup() {
    const db = initDatabase(":memory:")
    const insert = db.prepare("INSERT INTO albums (id,title,artist,category,role_history,listen_count,created_at,updated_at) VALUES (?,?,?,?,'[]',0,?,?)")
    insert.run(A, "A", "Artist", "classic", "2026-01-01", "2026-01-01")
    insert.run(B, "B", "Artist", "new", "2026-01-01", "2026-01-01")
    return { db, repository: createRotationStateRepository(db) }
}

function plan(focusAlbumId: string | null = A): RotationPlan {
    return {
        id: "33333333-3333-4333-8333-333333333333", name: "Active", targetSize: 1,
        items: [{ albumId: A, role: "classic", reason: "quota" }], albumIds: [A],
        roleQuotas: [{ role: "classic", targetCount: 1 }], createdAt: "2026-01-01T00:00:00.000Z",
        status: "active", acceptedAt: "2026-01-01T00:01:00.000Z", focusAlbumId,
    }
}

describe("rotation state repository", () => {
    it("persists an active Rotation and Focus together", () => {
        const { db, repository } = setup()
        repository.savePlan(plan())
        expect(repository.findActive()?.focusAlbumId).toBe(A)
        expect(repository.findActive()?.albumIds).toEqual([A])
        db.close()
    })

    it("rejects Focus outside the active Rotation", () => {
        const { db, repository } = setup()
        repository.savePlan(plan())
        expect(() => repository.setFocus(B)).toThrow("FOCUS_NOT_IN_ACTIVE_ROTATION")
        db.close()
    })

    it("stores listen events idempotently and cascades Album deletion", () => {
        const { db, repository } = setup()
        const event = { id: "44444444-4444-4444-8444-444444444444", albumId: A, listenedAt: "2026-01-01T00:00:00.000Z" }
        repository.saveListenEvent(event)
        repository.saveListenEvent(event)
        expect(repository.findListenEvents()).toHaveLength(1)
        expect(db.prepare("SELECT listen_count,last_listened FROM albums WHERE id=?").get(A)).toEqual({
            listen_count: 1,
            last_listened: event.listenedAt,
        })
        db.prepare("DELETE FROM albums WHERE id = ?").run(A)
        expect(repository.findListenEvents()).toEqual([])
        db.close()
    })

    it("adds, updates, and removes a journal without mutating the listen event",()=>{
        const {db,repository}=setup();const event={id:"44444444-4444-4444-8444-444444444444",albumId:A,listenedAt:"2026-01-01T00:00:00.000Z"};repository.saveListenEvent(event)
        const created=repository.saveJournal(event.id,{note:"Eine Erinnerung 🎧",moodTags:["nostalgic"],contextTags:["focused"]})
        expect(created).toMatchObject({...event,journal:{note:"Eine Erinnerung 🎧",moodTags:["nostalgic"],contextTags:["focused"]}})
        const createdAt=created.journal?.createdAt
        const updated=repository.saveJournal(event.id,{note:"Korrigiert",moodTags:[],contextTags:["evening"]})
        expect(updated.journal).toMatchObject({note:"Korrigiert",createdAt})
        expect(repository.deleteJournal(event.id)).toEqual(event)
        expect(db.prepare("SELECT COUNT(*) count FROM listen_events").get()).toEqual({count:1});db.close()
    })

    it("archives the previous active Rotation and leaves no stale draft", () => {
        const { db, repository } = setup()
        repository.savePlan(plan(null))
        const replacement = { ...plan(null), id: "66666666-6666-4666-8666-666666666666", name: "Replacement", status: "draft" as const, acceptedAt: undefined }
        repository.savePlan(replacement)
        repository.savePlan({ ...replacement, status: "active", acceptedAt: "2026-01-02T00:00:00.000Z" })

        expect(repository.findDraft()).toBeNull()
        expect(repository.findActive()).toMatchObject({ id: replacement.id, status: "active" })
        expect(repository.findHistory()).toMatchObject({ total: 1, items: [{ id: plan().id, status: "archived" }] })
        db.close()
    })

    it("keeps a Classic in Rotation but removes it when it becomes Admired", () => {
        const { db, repository } = setup()
        repository.savePlan(plan())
        db.prepare("UPDATE albums SET category = 'classic' WHERE id = ?").run(A)
        expect(repository.findActive()?.albumIds).toEqual([A])
        expect(repository.findActive()?.focusAlbumId).toBe(A)
        db.prepare("UPDATE albums SET category = 'admire' WHERE id = ?").run(A)
        expect(repository.findActive()?.albumIds).toEqual([])
        expect(repository.findActive()?.focusAlbumId).toBeNull()
        db.close()
    })

    it("exposes successful exports and copies an archived Rotation into a new draft", () => {
        const { db, repository } = setup()
        const original=plan(null); repository.savePlan(original)
        const replacement={...plan(null),id:"66666666-6666-4666-8666-666666666666",name:"Replacement"}
        repository.savePlan(replacement)
        db.prepare(`INSERT INTO export_operations
            (id,rotation_plan_id,created_at,status,album_ids,total_size_bytes,file_count)
            VALUES (?,?,?,'applied','[]',?,?)`).run("77777777-7777-4777-8777-777777777777",original.id,"2026-01-03T00:00:00.000Z",1234,7)
        expect(repository.findHistory().items[0]?.exports).toEqual([{
            id:"77777777-7777-4777-8777-777777777777",appliedAt:"2026-01-03T00:00:00.000Z",totalSizeBytes:1234,fileCount:7,
        }])
        const draft=repository.createDraftFromArchived(original.id,"88888888-8888-4888-8888-888888888888","2026-01-04T00:00:00.000Z")
        expect(draft).toMatchObject({id:"88888888-8888-4888-8888-888888888888",status:"draft",albumIds:[A]})
        expect(repository.findHistory().items[0]?.id).toBe(original.id)
        db.close()
    })
})
