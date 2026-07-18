import { randomUUID } from "node:crypto"
import type Database from "better-sqlite3"
import type { Album } from "../../../domain/albumTypes.js"
import type { AlbumRepository } from "./albumRepository.js"

export type AuditEventType = "album-role-changed" | "binding-reassigned" | "draft-item-removed" | "draft-item-replaced" | "rotation-accepted" | "album-role-change-undone" | "reflection-resolved" | "journal-created" | "journal-updated" | "journal-deleted"
export interface AuditEvent { id:string;eventType:AuditEventType;entityId:string;before:unknown;after:unknown;createdAt:string;undoneAt:string|null }

export function createAuditRepository(db: Database.Database, albums: AlbumRepository) {
    const comparable = (album: Album) => ({ ...album, createdAt: undefined })
    const hydrate = (row: {id:string;event_type:AuditEventType;entity_id:string;before_json:string;after_json:string;created_at:string;undone_at:string|null}): AuditEvent => ({ id:row.id,eventType:row.event_type,entityId:row.entity_id,before:JSON.parse(row.before_json) as unknown,after:JSON.parse(row.after_json) as unknown,createdAt:row.created_at,undoneAt:row.undone_at })
    const record = (eventType: AuditEventType, entityId: string, before: unknown, after: unknown) => {
        const event: AuditEvent = { id: randomUUID(), eventType, entityId, before, after, createdAt: new Date().toISOString(), undoneAt: null }
        db.prepare("INSERT INTO domain_audit_events VALUES (?,?,?,?,?,?,NULL)").run(event.id, event.eventType, entityId, JSON.stringify(before), JSON.stringify(after), event.createdAt)
        return event
    }
    return {
        saveAlbumWithAudit(before: Album, after: Album): void {
            db.transaction(() => {
                albums.save(after)
                if (before.category !== after.category) record("album-role-changed", after.id, before, after)
            })()
        },
        record,
        list(limit=20): AuditEvent[] { return (db.prepare("SELECT * FROM domain_audit_events ORDER BY created_at DESC, rowid DESC LIMIT ?").all(limit) as Parameters<typeof hydrate>[0][]).map(hydrate) },
        previewUndo(): AuditEvent {
            const row = db.prepare("SELECT * FROM domain_audit_events WHERE event_type='album-role-changed' AND undone_at IS NULL ORDER BY created_at DESC, rowid DESC LIMIT 1").get() as Parameters<typeof hydrate>[0] | undefined
            if (!row) throw new Error("NOTHING_TO_UNDO")
            const event = hydrate(row)
            const current = albums.findById(event.entityId)
            if (!current || JSON.stringify(comparable(current)) !== JSON.stringify(comparable(event.after as Album))) throw new Error("UNDO_CONFLICT")
            return event
        },
        undoLast(): AuditEvent {
            return db.transaction(() => {
                const event = this.previewUndo()
                albums.save(event.before as Album)
                const undoneAt = new Date().toISOString()
                db.prepare("UPDATE domain_audit_events SET undone_at=? WHERE id=?").run(undoneAt,event.id)
                record("album-role-change-undone", event.entityId, event.after, event.before)
                return { ...event, undoneAt }
            })()
        },
    }
}
export type AuditRepository = ReturnType<typeof createAuditRepository>
