import { describe, expect, it } from "vitest"
import { initDatabase } from "./connection.js"
import { createAlbumRepository } from "./albumRepository.js"
import { createAuditRepository } from "./auditRepository.js"

const ID="11111111-1111-4111-8111-111111111111"
describe("audit repository",()=>{
    it("records and safely undoes the last role change",()=>{
        const db=initDatabase(":memory:"); const albums=createAlbumRepository(db); const audit=createAuditRepository(db,albums)
        const before={id:ID,title:"Album",artist:"Artist",year:"2026",category:"new" as const,roleHistory:[],listenCount:0,lastListened:null}
        albums.save(before); const after={...before,category:"classic" as const}
        audit.saveAlbumWithAudit(albums.findById(ID)!,after)
        expect(audit.list()).toHaveLength(1); expect(albums.findById(ID)?.category).toBe("classic")
        expect(audit.previewUndo().before).toMatchObject({category:"new"})
        expect(audit.undoLast().undoneAt).not.toBeNull(); expect(albums.findById(ID)?.category).toBe("new")
        expect(audit.list()).toEqual(expect.arrayContaining([expect.objectContaining({eventType:"album-role-change-undone"})]))
        expect(()=>audit.undoLast()).toThrow("NOTHING_TO_UNDO"); db.close()
    })
    it("rejects undo after a conflicting later mutation",()=>{
        const db=initDatabase(":memory:"); const albums=createAlbumRepository(db); const audit=createAuditRepository(db,albums)
        const before={id:ID,title:"Album",artist:"Artist",year:"2026",category:"new" as const,roleHistory:[],listenCount:0,lastListened:null}
        albums.save(before); const after={...before,category:"classic" as const}; audit.saveAlbumWithAudit(albums.findById(ID)!,after)
        albums.save({...after,title:"Changed"}); expect(()=>audit.undoLast()).toThrow("UNDO_CONFLICT"); db.close()
    })
    it("records consequential non-undoable domain events",()=>{
        const db=initDatabase(":memory:"); const albums=createAlbumRepository(db); const audit=createAuditRepository(db,albums)
        audit.record("binding-reassigned","binding",{libraryAlbumId:"before"},{libraryAlbumId:"after"})
        audit.record("draft-item-removed","rotation",{albumId:ID},null)
        audit.record("draft-item-replaced","rotation",{albumId:ID},{albumId:"replacement"})
        audit.record("rotation-accepted","rotation",{status:"draft"},{status:"active"})
        expect(audit.list().map(event=>event.eventType)).toEqual(["rotation-accepted","draft-item-replaced","draft-item-removed","binding-reassigned"])
        expect(()=>audit.previewUndo()).toThrow("NOTHING_TO_UNDO"); db.close()
    })
})
