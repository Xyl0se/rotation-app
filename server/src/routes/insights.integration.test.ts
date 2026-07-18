import { afterAll,beforeAll,describe,expect,it } from "vitest"
import express from "express"
import type { Server } from "node:http"
import type { AddressInfo } from "node:net"
import type Database from "better-sqlite3"
import { once } from "node:events"
import { initDatabase } from "../infrastructure/persistence/sqlite/connection.js"
import { createInsightEvidenceRepository } from "../infrastructure/persistence/sqlite/insightEvidenceRepository.js"
import { createInsightsService } from "../application/insightsService.js"
import { createInsightsRouter } from "./insights.js"

describe("insights route",()=>{
    let db:Database.Database,server:Server,baseUrl:string
    beforeAll(async()=>{
        db=initDatabase(":memory:")
        const timestamp="2026-01-01T00:00:00.000Z",story=JSON.stringify({lifePhase:"school",memoryNote:"PRIVATE MEMORY",createdAt:timestamp,updatedAt:timestamp})
        db.prepare("INSERT INTO albums (id,title,artist,category,role_history,listen_count,story,created_at,updated_at) VALUES ('album','Album','Artist','new','[]',1,?,?,?)").run(story,timestamp,timestamp)
        db.prepare("INSERT INTO listen_events VALUES ('listen','album','2026-07-01T00:00:00.000Z')").run()
        db.prepare("INSERT INTO listening_journal_entries VALUES ('listen','PRIVATE JOURNAL','[]','[]',?,?)").run(timestamp,timestamp)
        const app=express();app.use("/insights",createInsightsRouter(createInsightsService(createInsightEvidenceRepository(db))))
        server=app.listen(0,"127.0.0.1");await once(server,"listening")
        baseUrl=`http://127.0.0.1:${(server.address() as AddressInfo).port}`
    })
    afterAll(async()=>{await new Promise<void>((resolve,reject)=>server.close(error=>error?reject(error):resolve()));db.close()})
    it("provides a public read-only, evidence-shaped response",async()=>{
        const response=await fetch(`${baseUrl}/insights`),body=await response.json() as Record<string,unknown>
        expect(response.status).toBe(200);expect(body).toMatchObject({roleOverview:{new:1},insights:[],buildingAreas:expect.arrayContaining(["library"])})
        expect(JSON.stringify(body)).not.toContain("PRIVATE MEMORY");expect(JSON.stringify(body)).not.toContain("PRIVATE JOURNAL")
    })
})
