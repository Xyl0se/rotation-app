import { performance } from "node:perf_hooks"
import { describe, expect, it } from "vitest"
import { initDatabase } from "./connection.js"
import { createAlbumRepository } from "./albumRepository.js"
import { createRotationStateRepository } from "./rotationStateRepository.js"
import { createInsightEvidenceRepository } from "./insightEvidenceRepository.js"
import { createInsightsService } from "../../../application/insightsService.js"

describe("representative SQLite performance gates", () => {
    it("uses bounded indexed hot paths with 10,000 Albums and 50 historical Rotations", () => {
        const db = initDatabase(":memory:")
        const insertAlbums = db.transaction(() => {
            const insert = db.prepare(`INSERT INTO albums
                (id,title,artist,year,category,role_history,listen_count,last_listened,created_at,updated_at)
                VALUES (?,?,?,?,?,'[]',0,NULL,?,?)`)
            for (let index = 0; index < 10_000; index++) {
                const id = `album-${String(index).padStart(5, "0")}`
                const created = new Date(Date.UTC(2026, 0, 1, 0, 0, index)).toISOString()
                insert.run(id, `Album ${index}`, `Artist ${index % 500}`, "2026", ["new", "growing", "comfort-food", "classic"][index % 4], created, created)
            }
        })
        insertAlbums()

        const insertHistory = db.transaction(() => {
            const plan = db.prepare("INSERT INTO rotation_plans VALUES (?,?,?,?,?,NULL,?,?,?)")
            const item = db.prepare("INSERT INTO rotation_plan_items VALUES (?,?,?,?,?,?,?)")
            const operation = db.prepare("INSERT INTO export_operations (id,rotation_plan_id,created_at,status,album_ids,total_size_bytes,file_count) VALUES (?,?,?,'applied','[]',?,?)")
            for (let rotation = 0; rotation < 50; rotation++) {
                const planId = `rotation-${rotation}`
                const timestamp = new Date(Date.UTC(2026, 1, rotation + 1)).toISOString()
                plan.run(planId, `Rotation ${rotation}`, 25, "[]", "archived", timestamp, timestamp, timestamp)
                for (let position = 0; position < 25; position++) {
                    const albumId = `album-${String(rotation * 25 + position).padStart(5, "0")}`
                    item.run(planId, albumId, position, "new", "quota", `Album ${position}`, "Artist")
                }
                operation.run(`export-${rotation}`, planId, timestamp, 1024, 25)
            }
        })
        insertHistory()

        const albums = createAlbumRepository(db)
        const rotations = createRotationStateRepository(db)
        const albumStarted = performance.now()
        expect(albums.findAll(10_000)).toHaveLength(10_000)
        expect(performance.now() - albumStarted).toBeLessThan(500)
        const historyStarted = performance.now()
        const history = rotations.findHistory(10, 0)
        expect(history).toMatchObject({ total: 50 })
        expect(history.items).toHaveLength(10)
        expect(performance.now() - historyStarted).toBeLessThan(250)
        const insightsStarted=performance.now()
        const insights=createInsightsService(createInsightEvidenceRepository(db)).evaluate(new Date("2026-07-18T12:00:00.000Z"))
        expect(insights.roleOverview.new).toBe(2_500)
        expect(performance.now()-insightsStarted).toBeLessThan(250)

        const explain = (sql: string) => (db.prepare(`EXPLAIN QUERY PLAN ${sql}`).all() as Array<{ detail: string }>).map(row => row.detail).join(" ")
        expect(explain("SELECT * FROM albums ORDER BY created_at DESC, id DESC LIMIT 10000 OFFSET 0")).toContain("idx_albums_created_id")
        expect(explain("SELECT id,album_id,listened_at FROM listen_events ORDER BY listened_at DESC, id DESC LIMIT 1000 OFFSET 0")).toContain("idx_listen_events_time")
        expect(explain("SELECT * FROM export_operations WHERE rotation_plan_id='rotation-1' AND status='applied' ORDER BY created_at DESC")).toContain("idx_exports_rotation_status_created")
        expect(explain("SELECT * FROM rotation_plans WHERE status='archived' ORDER BY archived_at DESC, created_at DESC LIMIT 10 OFFSET 0")).toContain("idx_rotation_history")
        db.close()
    })
})
