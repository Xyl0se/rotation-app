import { afterAll,beforeAll,describe,expect,it } from "vitest"
import express from "express"
import type { Server } from "node:http"
import type { AddressInfo } from "node:net"
import type Database from "better-sqlite3"
import { initDatabase } from "../infrastructure/persistence/sqlite/connection.js"
import { createAlbumRepository } from "../infrastructure/persistence/sqlite/albumRepository.js"
import { createReflectionInboxRepository } from "../infrastructure/persistence/sqlite/reflectionInboxRepository.js"
import { createReflectionInboxService } from "../application/reflectionInboxService.js"
import { createReflectionsRouter } from "./reflections.js"
import { createRequireWriteTokenForMutations } from "./middleware/writeToken.js"
import { createAuditRepository } from "../infrastructure/persistence/sqlite/auditRepository.js"

const TOKEN="reflection-test-token"
describe("reflection inbox route contract",()=>{
    let db:Database.Database;let server:Server;let baseUrl:string
    beforeAll(async()=>{
        db=initDatabase(":memory:")
        createAlbumRepository(db).save({id:"550e8400-e29b-41d4-a716-446655440000",title:"Old discovery",artist:"Artist",year:"",category:"new",roleHistory:[{role:"new",recordedAt:"2025-01-01T00:00:00.000Z",source:"coach"}],listenCount:3,lastListened:"2026-01-01T00:00:00.000Z",createdAt:"2025-01-01T00:00:00.000Z"})
        const albums=createAlbumRepository(db);const service=createReflectionInboxService(albums,createReflectionInboxRepository(db))
        const app=express();app.use(express.json());app.use("/reflections",createRequireWriteTokenForMutations(TOKEN),createReflectionsRouter(service,createAuditRepository(db,albums)))
        await new Promise<void>((resolve,reject)=>{server=app.listen(0,"127.0.0.1",()=>{baseUrl=`http://127.0.0.1:${(server.address() as AddressInfo).port}`;resolve()});server.on("error",reject)})
    })
    afterAll(async()=>{await new Promise<void>((resolve,reject)=>server.close(error=>error?reject(error):resolve()));db.close()})
    const request=(path:string,method="GET",body?:unknown,token?:string)=>fetch(`${baseUrl}${path}`,{method,headers:{...(body?{"content-type":"application/json"}:{}),...(token?{"x-rotation-write-token":token}:{})},body:body?JSON.stringify(body):undefined})

    it("keeps reads public and protects evaluation",async()=>{
        expect((await request("/reflections")).status).toBe(200)
        expect((await request("/reflections/evaluate","POST")).status).toBe(403)
        expect((await request("/reflections/evaluate","POST",undefined,TOKEN)).status).toBe(200)
    })
    it("evaluates idempotently, snoozes, reopens when due, dismisses and validates input",async()=>{
        const first=await (await request("/reflections/evaluate","POST",undefined,TOKEN)).json() as {items:Array<{id:string}>}
        const second=await (await request("/reflections/evaluate","POST",undefined,TOKEN)).json() as {items:Array<{id:string}>}
        expect(second.items[0]?.id).toBe(first.items[0]?.id)
        const id=first.items[0]!.id
        expect((await request(`/reflections/${id}/snooze`,"POST",{until:"invalid"},TOKEN)).status).toBe(400)
        expect((await request(`/reflections/${id}/snooze`,"POST",{until:"2099-01-01T00:00:00.000Z"},TOKEN)).status).toBe(200)
        expect((await (await request("/reflections")).json() as {items:unknown[]}).items).toHaveLength(0)
        db.prepare("UPDATE reflection_inbox_items SET snoozed_until='2020-01-01T00:00:00.000Z'").run()
        expect((await (await request("/reflections/evaluate","POST",undefined,TOKEN)).json() as {items:unknown[]}).items).toHaveLength(1)
        expect((await request(`/reflections/${id}/dismiss`,"POST",undefined,TOKEN)).status).toBe(200)
        expect((await (await request("/reflections/evaluate","POST",undefined,TOKEN)).json() as {items:unknown[]}).items).toHaveLength(0)
    })
    it("resolves only explicit valid items",async()=>{
        const missing="550e8400-e29b-41d4-a716-446655440099"
        expect((await request(`/reflections/not-a-uuid/resolve`,"POST",{resolution:"classic"},TOKEN)).status).toBe(400)
        expect((await request(`/reflections/${missing}/resolve`,"POST",{resolution:""},TOKEN)).status).toBe(400)
        expect((await request(`/reflections/${missing}/resolve`,"POST",{resolution:"classic"},TOKEN)).status).toBe(404)
    })
    it("records an audit event after a confirmed resolution",async()=>{
        db.prepare("UPDATE reflection_inbox_items SET state='open',due_at='2020-01-01T00:00:00.000Z',snoozed_until=NULL WHERE album_id=?").run("550e8400-e29b-41d4-a716-446655440000")
        const {items}=await (await request("/reflections")).json() as {items:Array<{id:string}>}
        expect((await request(`/reflections/${items[0]!.id}/resolve`,"POST",{resolution:"classic"},TOKEN)).status).toBe(200)
        expect(db.prepare("SELECT event_type FROM domain_audit_events ORDER BY created_at DESC LIMIT 1").get()).toEqual({event_type:"reflection-resolved"})
    })
})
