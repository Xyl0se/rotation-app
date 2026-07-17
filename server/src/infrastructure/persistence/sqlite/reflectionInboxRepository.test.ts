import { beforeEach, describe, expect, it } from "vitest"
import type Database from "better-sqlite3"
import { initDatabase } from "./connection.js"
import { createAlbumRepository } from "./albumRepository.js"
import { createReflectionInboxRepository } from "./reflectionInboxRepository.js"
import { createReflectionInboxService } from "../../../application/reflectionInboxService.js"

describe("reflection inbox",()=>{
    let db:Database.Database
    beforeEach(()=>{db=initDatabase(":memory:")})
    it("creates candidates idempotently and persists snooze state",()=>{
        const albums=createAlbumRepository(db)
        albums.save({id:"album-1",title:"Test",artist:"Artist",year:"",category:"new",roleHistory:[{role:"new",recordedAt:"2025-01-01T00:00:00.000Z",source:"coach"}],listenCount:3,lastListened:"2026-01-01T00:00:00.000Z",createdAt:"2025-01-01T00:00:00.000Z"})
        const repository=createReflectionInboxRepository(db)
        const service=createReflectionInboxService(albums,repository)
        expect(service.evaluate(new Date("2026-07-01T00:00:00.000Z"))).toHaveLength(1)
        expect(service.evaluate(new Date("2026-07-01T00:00:00.000Z"))).toHaveLength(1)
        const item=service.list()[0]
        service.snooze(item.id,"2026-08-01T00:00:00.000Z")
        expect(service.list()).toEqual([])
        expect(repository.findById(item.id)?.state).toBe("snoozed")
        expect((db.prepare("SELECT COUNT(*) count FROM reflection_inbox_items").get() as {count:number}).count).toBe(1)
    })

    it("projects archived albums as warm or cold without changing their role",()=>{
        const albums=createAlbumRepository(db)
        albums.save({id:"album-2",title:"Archive",artist:"Artist",year:"",category:"archive",roleHistory:[{role:"archive",recordedAt:"2024-01-01T00:00:00.000Z",source:"archive"}],listenCount:2,lastListened:"2024-01-01T00:00:00.000Z",createdAt:"2024-01-01T00:00:00.000Z"})
        const service=createReflectionInboxService(albums,createReflectionInboxRepository(db))
        const [item]=service.evaluate(new Date("2026-07-01T00:00:00.000Z"))
        expect(item.ruleCode).toBe("archive-return-candidate")
        expect(item.evidence.archiveTemperature).toBe("cold")
        expect(albums.findById("album-2")?.category).toBe("archive")
    })

    it("resolves obsolete evidence after a role change",()=>{
        const albums=createAlbumRepository(db)
        const original={id:"album-3",title:"Changing",artist:"Artist",year:"",category:"new" as const,roleHistory:[{role:"new" as const,recordedAt:"2025-01-01T00:00:00.000Z",source:"coach" as const}],listenCount:3,lastListened:"2026-01-01T00:00:00.000Z",createdAt:"2025-01-01T00:00:00.000Z"}
        albums.save(original);const repository=createReflectionInboxRepository(db);const service=createReflectionInboxService(albums,repository)
        const [item]=service.evaluate(new Date("2026-07-01T00:00:00.000Z"));albums.save({...original,category:"classic",roleHistory:[...original.roleHistory,{role:"classic",recordedAt:"2026-07-01T00:00:00.000Z",source:"reflection"}]})
        expect(service.evaluate(new Date("2026-07-01T00:01:00.000Z"))).toEqual([])
        expect(repository.findById(item.id)?.resolution).toBe("obsolete")
    })

    it("keeps dismissed evidence quiet and delays materially new recurrence",()=>{
        const albums=createAlbumRepository(db);const base={id:"album-4",title:"Quiet",artist:"Artist",year:"",category:"new" as const,roleHistory:[{role:"new" as const,recordedAt:"2025-01-01T00:00:00.000Z",source:"coach" as const}],listenCount:3,lastListened:"2026-01-01T00:00:00.000Z",createdAt:"2025-01-01T00:00:00.000Z"}
        albums.save(base);const repository=createReflectionInboxRepository(db);const service=createReflectionInboxService(albums,repository);const now=new Date("2026-07-01T00:00:00.000Z")
        const [item]=service.evaluate(now);service.dismiss(item.id);expect(service.evaluate(now)).toEqual([])
        albums.save({...base,listenCount:6,lastListened:"2026-07-02T00:00:00.000Z"})
        expect(service.evaluate(new Date("2026-07-02T00:00:00.000Z"))).toEqual([])
        expect(service.evaluate(new Date("2026-08-02T00:00:00.000Z"))).toHaveLength(1)
    })
})
