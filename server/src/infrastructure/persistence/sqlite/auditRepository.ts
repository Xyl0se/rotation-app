import { randomUUID } from "node:crypto"
import type Database from "better-sqlite3"
import type { Album } from "../../../domain/albumTypes.js"
import type { AlbumRepository } from "./albumRepository.js"

export interface AuditEvent { id:string;eventType:"album-role-changed";entityId:string;before:Album;after:Album;createdAt:string;undoneAt:string|null }

export function createAuditRepository(db: Database.Database, albums: AlbumRepository) {
    const comparable = (album: Album) => ({ ...album, createdAt: undefined })
    const hydrate = (row: {id:string;event_type:"album-role-changed";entity_id:string;before_json:string;after_json:string;created_at:string;undone_at:string|null}): AuditEvent => ({ id:row.id,eventType:row.event_type,entityId:row.entity_id,before:JSON.parse(row.before_json) as Album,after:JSON.parse(row.after_json) as Album,createdAt:row.created_at,undoneAt:row.undone_at })
    return {
        saveAlbumWithAudit(before: Album, after: Album): void {
            db.transaction(() => {
                albums.save(after)
                if (before.category !== after.category) db.prepare("INSERT INTO domain_audit_events VALUES (?,?,?,?,?,?,NULL)").run(randomUUID(),"album-role-changed",after.id,JSON.stringify(before),JSON.stringify(after),new Date().toISOString())
            })()
        },
        list(limit=20): AuditEvent[] { return (db.prepare("SELECT * FROM domain_audit_events ORDER BY created_at DESC LIMIT ?").all(limit) as Parameters<typeof hydrate>[0][]).map(hydrate) },
        undoLast(): AuditEvent {
            return db.transaction(() => {
                const row = db.prepare("SELECT * FROM domain_audit_events WHERE undone_at IS NULL ORDER BY created_at DESC LIMIT 1").get() as Parameters<typeof hydrate>[0] | undefined
                if (!row) throw new Error("NOTHING_TO_UNDO")
                const event = hydrate(row)
                const current = albums.findById(event.entityId)
                if (!current || JSON.stringify(comparable(current)) !== JSON.stringify(comparable(event.after))) throw new Error("UNDO_CONFLICT")
                albums.save(event.before)
                const undoneAt = new Date().toISOString()
                db.prepare("UPDATE domain_audit_events SET undone_at=? WHERE id=?").run(undoneAt,event.id)
                return { ...event, undoneAt }
            })()
        },
    }
}
export type AuditRepository = ReturnType<typeof createAuditRepository>
