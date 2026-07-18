import type Database from "better-sqlite3"
import type { RoleOverview } from "../../../domain/insightTypes.js"

export interface ListeningWindowEvidence { total:number;discovery:number;familiar:number }
export interface RotationComparisonEvidence { entering:number;leaving:number;unchanged:number } 

export function createInsightEvidenceRepository(db:Database.Database) {
    const roleAtListen=`COALESCE((SELECT json_extract(entry.value,'$.role') FROM json_each(CASE WHEN json_valid(a.role_history) THEN a.role_history ELSE '[]' END) entry
        WHERE json_extract(entry.value,'$.recordedAt')<=l.listened_at ORDER BY json_extract(entry.value,'$.recordedAt') DESC LIMIT 1),a.category)`
    return {
        roleOverview():RoleOverview {
            const result:RoleOverview={new:0,growing:0,"comfort-food":0,classic:0,admire:0,archive:0,unassigned:0}
            const rows=db.prepare("SELECT COALESCE(category,'unassigned') role,COUNT(*) count FROM albums GROUP BY COALESCE(category,'unassigned')").all() as Array<{role:keyof RoleOverview;count:number}>
            for(const row of rows)if(row.role in result)result[row.role]=row.count
            return result
        },
        listeningWindow(from:string,to:string):ListeningWindowEvidence {
            return db.prepare(`SELECT COUNT(*) total,
                COALESCE(SUM(CASE WHEN role IN ('new','growing') THEN 1 ELSE 0 END),0) discovery,
                COALESCE(SUM(CASE WHEN role IN ('comfort-food','classic') THEN 1 ELSE 0 END),0) familiar
                FROM (SELECT ${roleAtListen} role FROM listen_events l JOIN albums a ON a.id=l.album_id
                WHERE l.listened_at>=? AND l.listened_at<?)`).get(from,to) as ListeningWindowEvidence
        },
        dormantAlbums(before:string):number {
            return (db.prepare(`SELECT COUNT(*) count FROM albums a WHERE (a.last_listened IS NULL OR a.last_listened<?)
                AND NOT EXISTS (SELECT 1 FROM rotation_plan_items i JOIN rotation_plans p ON p.id=i.rotation_plan_id WHERE p.status='active' AND i.album_id=a.id)`).get(before) as {count:number}).count
        },
        rediscoveredListens(since:string,minimumGapDays:number):number {
            return (db.prepare(`SELECT COUNT(*) count FROM listen_events current WHERE current.listened_at>=?
                AND (SELECT MAX(previous.listened_at) FROM listen_events previous WHERE previous.album_id=current.album_id AND previous.listened_at<current.listened_at)
                    <=datetime(current.listened_at,?)`).get(since,`-${minimumGapDays} days`) as {count:number}).count
        },
        recentRoleTransitions(since:string):number {
            return (db.prepare(`SELECT COUNT(*) count FROM albums a,json_each(CASE WHEN json_valid(a.role_history) THEN a.role_history ELSE '[]' END) entry
                WHERE CAST(entry.key AS INTEGER)>0 AND json_extract(entry.value,'$.recordedAt')>=?`).get(since) as {count:number}).count
        },
        rotationComparison():RotationComparisonEvidence|null {
            const active=db.prepare("SELECT id FROM rotation_plans WHERE status='active' LIMIT 1").get() as {id:string}|undefined
            const previous=db.prepare("SELECT id FROM rotation_plans WHERE status='archived' ORDER BY archived_at DESC,created_at DESC LIMIT 1").get() as {id:string}|undefined
            if(!active||!previous)return null
            const count=(sql:string,first=active.id,second=previous.id)=>(db.prepare(sql).get(first,second) as {count:number}).count
            return {
                entering:count("SELECT COUNT(*) count FROM rotation_plan_items current WHERE current.rotation_plan_id=? AND NOT EXISTS (SELECT 1 FROM rotation_plan_items old WHERE old.rotation_plan_id=? AND old.album_id=current.album_id)"),
                leaving:count("SELECT COUNT(*) count FROM rotation_plan_items old WHERE old.rotation_plan_id=? AND NOT EXISTS (SELECT 1 FROM rotation_plan_items current WHERE current.rotation_plan_id=? AND current.album_id=old.album_id)",previous.id,active.id),
                unchanged:count("SELECT COUNT(*) count FROM rotation_plan_items current WHERE current.rotation_plan_id=? AND EXISTS (SELECT 1 FROM rotation_plan_items old WHERE old.rotation_plan_id=? AND old.album_id=current.album_id)"),
            }
        },
    }
}

export type InsightEvidenceRepository=ReturnType<typeof createInsightEvidenceRepository>
