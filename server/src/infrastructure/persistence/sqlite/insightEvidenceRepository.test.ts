import { describe,expect,it } from "vitest"
import { initDatabase } from "./connection.js"
import { createInsightEvidenceRepository } from "./insightEvidenceRepository.js"

describe("insight evidence repository",()=>{
    it("uses the role valid at listening time and detects a long-gap return",()=>{
        const db=initDatabase(":memory:")
        const history=JSON.stringify([{role:"new",recordedAt:"2025-01-01T00:00:00.000Z",source:"coach"},{role:"classic",recordedAt:"2026-06-01T00:00:00.000Z",source:"reflection"}])
        db.prepare("INSERT INTO albums (id,title,artist,category,role_history,listen_count,last_listened,created_at,updated_at) VALUES ('album','Album','Artist','classic',?,2,?,?,?)").run(history,"2026-07-01T00:00:00.000Z","2025-01-01T00:00:00.000Z","2026-07-01T00:00:00.000Z")
        const listen=db.prepare("INSERT INTO listen_events VALUES (?,?,?)");listen.run("old","album","2025-02-01T00:00:00.000Z");listen.run("new","album","2026-07-01T00:00:00.000Z")
        const evidence=createInsightEvidenceRepository(db)
        expect(evidence.listeningWindow("2025-01-01T00:00:00.000Z","2025-03-01T00:00:00.000Z")).toEqual({total:1,discovery:1,familiar:0})
        expect(evidence.listeningWindow("2026-06-01T00:00:00.000Z","2026-08-01T00:00:00.000Z")).toEqual({total:1,discovery:0,familiar:1})
        expect(evidence.rediscoveredListens("2026-06-01T00:00:00.000Z",180)).toBe(1)
        expect(evidence.recentRoleTransitions("2026-01-01T00:00:00.000Z")).toBe(1)
        db.close()
    })
    it("derives extended evidence only from artist, year, and structured Story fields",()=>{
        const db=initDatabase(":memory:"),insert=db.prepare(`INSERT INTO albums (id,title,artist,year,category,role_history,listen_count,story,created_at,updated_at)
            VALUES (?,?,?,?, 'classic','[]',0,?,?,?)`),story=JSON.stringify({lifePhase:"school",acquiredBecause:"gift",memoryNote:"PRIVATE PROSE",createdAt:"2026-01-01T00:00:00.000Z",updatedAt:"2026-01-01T00:00:00.000Z"})
        for(let index=0;index<10;index++)insert.run(`album-${index}`,`Album ${index}`,index<2?"Air":`Artist ${index}`,index<6?"1998":"1972",story,"2026-01-01T00:00:00.000Z","2026-01-01T00:00:00.000Z")
        const listen=db.prepare("INSERT INTO listen_events VALUES (?,?,?)");for(let index=0;index<8;index++)listen.run(`listen-${index}`,`album-${index%2}`,`2026-07-${String(index+1).padStart(2,"0")}T12:00:00.000Z`)
        const evidence=createInsightEvidenceRepository(db)
        expect(evidence.recurringArtist("2026-06-01T00:00:00.000Z")).toEqual({artist:"Air",listenCount:8,albumCount:2,totalListens:8})
        expect(evidence.listeningEra("2026-06-01T00:00:00.000Z")).toMatchObject({era:"1990s",listenCount:8,albumCount:6,knownYearAlbums:10})
        insert.run("private-album","Private","Private Artist","9999",JSON.stringify({...JSON.parse(story) as object,lifePhase:"PRIVATE SUBJECT",acquiredBecause:"PRIVATE REASON"}),"2026-01-01T00:00:00.000Z","2026-01-01T00:00:00.000Z")
        for(let index=0;index<10;index++)listen.run(`private-listen-${index}`,"private-album",`2026-07-${String(index+11).padStart(2,"0")}T12:00:00.000Z`)
        expect(evidence.listeningEra("2026-06-01T00:00:00.000Z")?.knownYearAlbums).toBe(10)
        expect(evidence.personalHistory("2026-06-01T00:00:00.000Z")).toEqual({kind:"life-phase",value:"school",listenCount:8,annotatedAlbums:10})
        expect(JSON.stringify(evidence.personalHistory("2026-06-01T00:00:00.000Z"))).not.toContain("PRIVATE PROSE")
        db.close()
    })
    it("finds missing Story fields but treats explicit unknown values as answered",()=>{
        const db=initDatabase(":memory:"),insert=db.prepare(`INSERT INTO albums (id,title,artist,category,role_history,listen_count,story,created_at,updated_at)
            VALUES (?,?,?,'classic','[]',0,?,?,?)`),timestamp="2026-01-01T00:00:00.000Z"
        insert.run("missing-both","Missing both","Artist",null,timestamp,timestamp)
        insert.run("missing-life","Missing life","Artist",JSON.stringify({acquiredBecause:"digital",createdAt:timestamp,updatedAt:timestamp}),timestamp,timestamp)
        insert.run("answered","Answered","Artist",JSON.stringify({acquiredBecause:"unknown",lifePhase:"unknown",createdAt:timestamp,updatedAt:timestamp}),timestamp,timestamp)
        const candidates=createInsightEvidenceRepository(db).memoryPromptCandidates()
        expect(candidates).toEqual(expect.arrayContaining([
            {albumId:"missing-both",title:"Missing both",artist:"Artist",missingAcquisition:true,missingLifePhase:true},
            {albumId:"missing-life",title:"Missing life",artist:"Artist",missingAcquisition:false,missingLifePhase:true},
        ]))
        expect(candidates.some(item=>item.albumId==="answered")).toBe(false)
        db.close()
    })
})
