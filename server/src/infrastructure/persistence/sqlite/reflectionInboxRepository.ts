import { randomUUID } from "node:crypto"
import type Database from "better-sqlite3"
import type { ReflectionEvidence, ReflectionInboxItem, ReflectionInboxState, ReflectionRuleCode } from "../../../domain/reflectionTypes.js"

interface Candidate { albumId:string;ruleCode:ReflectionRuleCode;evidenceKey:string;evidence:ReflectionEvidence;dueAt:string }
interface Row { id:string;album_id:string;album_title:string;album_artist:string;album_cover_url:string|null;rule_code:ReflectionRuleCode;state:ReflectionInboxState;evidence_json:string;created_at:string;due_at:string;snoozed_until:string|null;resolved_at:string|null;resolution:string|null }

export function createReflectionInboxRepository(db: Database.Database) {
    const hydrate = (row: Row): ReflectionInboxItem => ({
        id:row.id,albumId:row.album_id,albumTitle:row.album_title,albumArtist:row.album_artist,
        albumCoverUrl:row.album_cover_url ?? undefined,ruleCode:row.rule_code,state:row.state,
        evidence:JSON.parse(row.evidence_json) as ReflectionEvidence,createdAt:row.created_at,dueAt:row.due_at,
        snoozedUntil:row.snoozed_until,resolvedAt:row.resolved_at,resolution:row.resolution,
    })
    const select = `SELECT r.*,a.title album_title,a.artist album_artist,a.cover_url album_cover_url
        FROM reflection_inbox_items r JOIN albums a ON a.id=r.album_id`
    return {
        upsertCandidates(candidates: Candidate[], now: string): void {
            db.transaction(() => {
                const insert = db.prepare(`INSERT INTO reflection_inbox_items
                    (id,album_id,rule_code,evidence_key,state,evidence_json,created_at,due_at,updated_at)
                    VALUES (?,?,?,?, 'open',?,?,?,?) ON CONFLICT(album_id,rule_code,evidence_key) DO NOTHING`)
                const quietOlder = db.prepare(`UPDATE reflection_inbox_items SET state='resolved',resolved_at=?,resolution='superseded',updated_at=?
                    WHERE album_id=? AND state IN ('open','snoozed') AND NOT (rule_code=? AND evidence_key=?)`)
                for (const candidate of candidates) {
                    quietOlder.run(now,now,candidate.albumId,candidate.ruleCode,candidate.evidenceKey)
                    insert.run(randomUUID(),candidate.albumId,candidate.ruleCode,candidate.evidenceKey,JSON.stringify(candidate.evidence),now,candidate.dueAt,now)
                }
                const currentKeys=new Set(candidates.map(candidate=>`${candidate.albumId}\u0000${candidate.ruleCode}\u0000${candidate.evidenceKey}`))
                const active=db.prepare("SELECT id,album_id,rule_code,evidence_key FROM reflection_inbox_items WHERE state IN ('open','snoozed')").all() as Array<{id:string;album_id:string;rule_code:string;evidence_key:string}>
                const obsolete=db.prepare("UPDATE reflection_inbox_items SET state='resolved',resolved_at=?,resolution='obsolete',updated_at=? WHERE id=?")
                for(const row of active){if(!currentKeys.has(`${row.album_id}\u0000${row.rule_code}\u0000${row.evidence_key}`))obsolete.run(now,now,row.id)}
                db.prepare(`UPDATE reflection_inbox_items SET state='open',snoozed_until=NULL,updated_at=?
                    WHERE state='snoozed' AND snoozed_until<=?`).run(now,now)
            })()
        },
        listActionable(now=new Date().toISOString()): ReflectionInboxItem[] {
            return (db.prepare(`${select} WHERE r.state='open' AND r.due_at<=? ORDER BY
                COALESCE(json_extract(r.evidence_json,'$.lastListened'),json_extract(r.evidence_json,'$.roleSince'),r.created_at) ASC,
                r.created_at ASC`).all(now) as Row[]).map(hydrate)
        },
        countDeferrals(albumId:string,ruleCode:ReflectionRuleCode,since:string|null=null):number {
            return (db.prepare(`SELECT COUNT(*) count FROM reflection_inbox_items
                WHERE album_id=? AND rule_code=? AND (? IS NULL OR created_at>=?)
                AND (state='dismissed' OR (state='resolved' AND resolution='dismissed-for-evidence'))`)
                .get(albumId,ruleCode,since,since) as {count:number}).count
        },
        findById(id:string): ReflectionInboxItem | undefined {
            const row=db.prepare(`${select} WHERE r.id=?`).get(id) as Row|undefined
            return row ? hydrate(row) : undefined
        },
        transition(id:string,state:ReflectionInboxState,now:string,options:{snoozedUntil?:string;resolution?:string}={}): ReflectionInboxItem | undefined {
            db.prepare(`UPDATE reflection_inbox_items SET state=?,snoozed_until=?,resolved_at=?,resolution=?,updated_at=? WHERE id=?`)
                .run(state,options.snoozedUntil ?? null,state === "resolved" || state === "dismissed" ? now : null,options.resolution ?? null,now,id)
            return this.findById(id)
        },
    }
}
export type ReflectionInboxRepository = ReturnType<typeof createReflectionInboxRepository>
