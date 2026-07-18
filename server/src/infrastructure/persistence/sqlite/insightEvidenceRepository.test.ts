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
})
