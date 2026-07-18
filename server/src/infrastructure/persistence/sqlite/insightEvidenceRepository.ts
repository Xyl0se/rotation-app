import type Database from "better-sqlite3"
import type { RoleOverview } from "../../../domain/insightTypes.js"

export interface ListeningWindowEvidence { total:number;discovery:number;familiar:number }
export interface RotationComparisonEvidence { entering:number;leaving:number;unchanged:number } 
export interface ArtistEvidence { artist:string;listenCount:number;albumCount:number;totalListens:number }
export interface EraEvidence { era:string;listenCount:number;albumCount:number;knownYearAlbums:number;totalKnownYearListens:number }
export interface PersonalHistoryEvidence { kind:"life-phase"|"acquisition";value:string;listenCount:number;annotatedAlbums:number }
export interface MemoryPromptCandidate { albumId:string;title:string;artist:string;missingAcquisition:boolean;missingLifePhase:boolean }

export function createInsightEvidenceRepository(db:Database.Database) {
    const validLifePhases="'childhood','school','studies','first-apartment','relationship','breakup','work','travel','family','current','other'"
    const validAcquisitionReasons="'artist','friend-recommendation','specific-song','concert','review','record-store','gift','digital','random-discovery','life-phase','other'"
    const usableYear="length(year)=4 AND year GLOB '[0-9][0-9][0-9][0-9]' AND CAST(year AS INTEGER) BETWEEN 1900 AND 2099"
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
        recurringArtist(since:string):ArtistEvidence|null {
            const total=(db.prepare("SELECT COUNT(*) count FROM listen_events WHERE listened_at>=?").get(since) as {count:number}).count
            const top=db.prepare(`SELECT a.artist artist,COUNT(*) listenCount,COUNT(DISTINCT a.id) albumCount FROM listen_events l JOIN albums a ON a.id=l.album_id
                WHERE l.listened_at>=? GROUP BY a.artist ORDER BY listenCount DESC,a.artist ASC LIMIT 1`).get(since) as Omit<ArtistEvidence,"totalListens">|undefined
            return top?{...top,totalListens:total}:null
        },
        listeningEra(since:string):EraEvidence|null {
            const knownYearAlbums=(db.prepare(`SELECT COUNT(*) count FROM albums WHERE ${usableYear}`).get() as {count:number}).count
            const totalKnownYearListens=(db.prepare(`SELECT COUNT(*) count FROM listen_events l JOIN albums a ON a.id=l.album_id
                WHERE l.listened_at>=? AND length(a.year)=4 AND a.year GLOB '[0-9][0-9][0-9][0-9]' AND CAST(a.year AS INTEGER) BETWEEN 1900 AND 2099`).get(since) as {count:number}).count
            const top=db.prepare(`SELECT ((CAST(a.year AS INTEGER)/10)*10) era,COUNT(*) listenCount FROM listen_events l JOIN albums a ON a.id=l.album_id
                WHERE l.listened_at>=? AND length(a.year)=4 AND a.year GLOB '[0-9][0-9][0-9][0-9]' AND CAST(a.year AS INTEGER) BETWEEN 1900 AND 2099 GROUP BY era ORDER BY listenCount DESC,era ASC LIMIT 1`).get(since) as {era:number;listenCount:number}|undefined
            if(!top)return null
            const albumCount=(db.prepare(`SELECT COUNT(*) count FROM albums WHERE length(year)=4 AND year GLOB '[0-9][0-9][0-9][0-9]' AND ((CAST(year AS INTEGER)/10)*10)=?`).get(top.era) as {count:number}).count
            return {era:`${top.era}s`,listenCount:top.listenCount,albumCount,knownYearAlbums,totalKnownYearListens}
        },
        personalHistory(since:string):PersonalHistoryEvidence|null {
            const annotatedAlbums=(db.prepare(`SELECT COUNT(*) count FROM albums WHERE story IS NOT NULL AND json_valid(story)
                AND (json_extract(story,'$.lifePhase') IN (${validLifePhases}) OR json_extract(story,'$.acquiredBecause') IN (${validAcquisitionReasons}))`).get() as {count:number}).count
            const top=(field:"lifePhase"|"acquiredBecause",allowed:string)=>db.prepare(`SELECT json_extract(a.story,'$.${field}') value,COUNT(*) listenCount FROM listen_events l JOIN albums a ON a.id=l.album_id
                WHERE l.listened_at>=? AND a.story IS NOT NULL AND json_valid(a.story) AND json_extract(a.story,'$.${field}') IS NOT NULL
                AND json_extract(a.story,'$.${field}') IN (${allowed})
                GROUP BY value ORDER BY listenCount DESC,value ASC LIMIT 1`).get(since) as {value:string;listenCount:number}|undefined
            const life=top("lifePhase",validLifePhases),acquisition=top("acquiredBecause",validAcquisitionReasons)
            if(!life&&!acquisition)return null
            if(life&&(!acquisition||life.listenCount>=acquisition.listenCount))return {kind:"life-phase",...life,annotatedAlbums}
            return {kind:"acquisition",...acquisition!,annotatedAlbums}
        },
        memoryPromptCandidates():MemoryPromptCandidate[] {
            const safeStory="CASE WHEN story IS NOT NULL AND json_valid(story) THEN story ELSE '{}' END"
            return (db.prepare(`SELECT id albumId,title,artist,
                CASE WHEN json_type(${safeStory},'$.acquiredBecause') IS NULL OR COALESCE(json_extract(${safeStory},'$.acquiredBecause'),'')='' THEN 1 ELSE 0 END missingAcquisition,
                CASE WHEN json_type(${safeStory},'$.lifePhase') IS NULL OR COALESCE(json_extract(${safeStory},'$.lifePhase'),'')='' THEN 1 ELSE 0 END missingLifePhase
                FROM albums
                WHERE json_type(${safeStory},'$.acquiredBecause') IS NULL OR COALESCE(json_extract(${safeStory},'$.acquiredBecause'),'')=''
                   OR json_type(${safeStory},'$.lifePhase') IS NULL OR COALESCE(json_extract(${safeStory},'$.lifePhase'),'')=''
                ORDER BY id`).all() as Array<Omit<MemoryPromptCandidate,"missingAcquisition"|"missingLifePhase">&{missingAcquisition:number;missingLifePhase:number}>).map(row=>({
                    ...row,missingAcquisition:row.missingAcquisition===1,missingLifePhase:row.missingLifePhase===1,
                }))
        },
    }
}

export type InsightEvidenceRepository=ReturnType<typeof createInsightEvidenceRepository>
