import Database from "better-sqlite3"
import type { ListenEvent, ListeningJournalEntry, JournalContext, JournalMood, RotationPlan, RotationSettings } from "../../../domain/rotationTypes.js"

export function createRotationStateRepository(db: Database.Database) {
    const saveListen = db.prepare("INSERT INTO listen_events VALUES (?,?,?) ON CONFLICT(id) DO NOTHING")
    const savePlanTx = db.transaction((plan: RotationPlan) => {
        if (plan.status === "active") {
            const now = new Date().toISOString()
            db.prepare("UPDATE rotation_plans SET status='archived', focus_album_id=NULL, archived_at=? WHERE status='active' AND id!=?").run(now, plan.id)
            db.prepare("DELETE FROM rotation_plans WHERE status='draft' AND id!=?").run(plan.id)
        }
        db.prepare(`INSERT INTO rotation_plans (id,name,target_size,role_quotas_json,status,focus_album_id,created_at,accepted_at,archived_at)
            VALUES (?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,target_size=excluded.target_size,
            role_quotas_json=excluded.role_quotas_json,status=excluded.status,focus_album_id=NULL,
            accepted_at=excluded.accepted_at,archived_at=excluded.archived_at`).run(
            plan.id, plan.name, plan.targetSize, JSON.stringify(plan.roleQuotas), plan.status,
            null, plan.createdAt, plan.acceptedAt ?? null, plan.archivedAt ?? null,
        )
        db.prepare("DELETE FROM rotation_plan_items WHERE rotation_plan_id = ?").run(plan.id)
        const insert = db.prepare(`INSERT INTO rotation_plan_items
            (rotation_plan_id,album_id,position,role,reason,album_title_snapshot,album_artist_snapshot)
            SELECT ?,?,?,?,?,title,artist FROM albums WHERE id=?`)
        plan.items.forEach((item, position) => {
            if (insert.run(plan.id, item.albumId, position, item.role, item.reason, item.albumId).changes !== 1) {
                throw new Error("ALBUM_NOT_FOUND")
            }
        })
        if (plan.focusAlbumId) {
            const member = plan.items.some(item => item.albumId === plan.focusAlbumId)
            if (!member || plan.status !== "active") throw new Error("FOCUS_NOT_IN_ACTIVE_ROTATION")
            db.prepare("UPDATE rotation_plans SET focus_album_id = ? WHERE id = ?").run(plan.focusAlbumId, plan.id)
        }
    })
    const saveListenEventTx = db.transaction((event: ListenEvent) => {
        const inserted = saveListen.run(event.id, event.albumId, event.listenedAt)
        if (inserted.changes > 0) {
            db.prepare(`UPDATE albums SET listen_count = listen_count + 1,
                last_listened = CASE WHEN last_listened IS NULL OR last_listened < ? THEN ? ELSE last_listened END,
                updated_at = ? WHERE id = ?`).run(event.listenedAt, event.listenedAt, new Date().toISOString(), event.albumId)
        }
    })

    function hydrate(row: Record<string, unknown> | undefined): RotationPlan | null {
        if (!row) return null
        const items = db.prepare("SELECT album_id,role,reason,album_title_snapshot,album_artist_snapshot FROM rotation_plan_items WHERE rotation_plan_id=? ORDER BY position")
            .all(row.id as string) as Array<{ album_id: string; role: RotationPlan["items"][number]["role"]; reason: RotationPlan["items"][number]["reason"]; album_title_snapshot:string;album_artist_snapshot:string }>
        const exports = db.prepare(`SELECT id,created_at,total_size_bytes,file_count FROM export_operations
            WHERE rotation_plan_id=? AND status='applied' ORDER BY created_at DESC`).all(row.id as string) as Array<{id:string;created_at:string;total_size_bytes:number|null;file_count:number|null}>
        return {
            id: row.id as string, name: row.name as string, targetSize: row.target_size as number,
            roleQuotas: JSON.parse(row.role_quotas_json as string) as RotationPlan["roleQuotas"],
            status: row.status as RotationPlan["status"], focusAlbumId: row.focus_album_id as string | null,
            createdAt: row.created_at as string,
            acceptedAt: typeof row.accepted_at === "string" ? row.accepted_at : undefined,
            archivedAt: typeof row.archived_at === "string" ? row.archived_at : undefined,
            items: items.map(item => ({ albumId: item.album_id, role: item.role, reason: item.reason, albumTitleSnapshot: item.album_title_snapshot, albumArtistSnapshot: item.album_artist_snapshot })),
            albumIds: items.map(item => item.album_id),
            exports: exports.map(item => ({ id:item.id, appliedAt:item.created_at, totalSizeBytes:item.total_size_bytes, fileCount:item.file_count })),
        }
    }

    function hydrateListen(row:{id:string;album_id:string;listened_at:string;note:string|null;mood_tags_json:string|null;context_tags_json:string|null;journal_created_at:string|null;journal_updated_at:string|null}):ListenEvent {
        const event:ListenEvent={id:row.id,albumId:row.album_id,listenedAt:row.listened_at}
        if(row.journal_created_at&&row.journal_updated_at)event.journal={note:row.note??"",moodTags:JSON.parse(row.mood_tags_json??"[]") as JournalMood[],contextTags:JSON.parse(row.context_tags_json??"[]") as JournalContext[],createdAt:row.journal_created_at,updatedAt:row.journal_updated_at}
        return event
    }
    const listenSelect=`SELECT l.id,l.album_id,l.listened_at,j.note,j.mood_tags_json,j.context_tags_json,j.created_at journal_created_at,j.updated_at journal_updated_at
        FROM listen_events l LEFT JOIN listening_journal_entries j ON j.listen_event_id=l.id`

    return {
        savePlan(plan: RotationPlan): void { savePlanTx(plan) },
        findActive(): RotationPlan | null { return hydrate(db.prepare("SELECT * FROM rotation_plans WHERE status='active'").get() as Record<string, unknown> | undefined) },
        findDraft(): RotationPlan | null { return hydrate(db.prepare("SELECT * FROM rotation_plans WHERE status='draft' ORDER BY created_at DESC LIMIT 1").get() as Record<string, unknown> | undefined) },
        findHistory(limit = 20, offset = 0): { items: RotationPlan[]; total: number } {
            const rows = db.prepare("SELECT * FROM rotation_plans WHERE status='archived' ORDER BY archived_at DESC, created_at DESC LIMIT ? OFFSET ?").all(limit, offset) as Record<string, unknown>[]
            const total = (db.prepare("SELECT COUNT(*) count FROM rotation_plans WHERE status='archived'").get() as { count: number }).count
            return { items: rows.map(row => hydrate(row)!), total }
        },
        createDraftFromArchived(id: string, draftId: string, createdAt: string): RotationPlan {
            return db.transaction(() => {
                const source = hydrate(db.prepare("SELECT * FROM rotation_plans WHERE id=? AND status='archived'").get(id) as Record<string,unknown>|undefined)
                if (!source) throw new Error("ARCHIVED_ROTATION_NOT_FOUND")
                db.prepare("DELETE FROM rotation_plans WHERE status='draft'").run()
                const availableItems = source.items.filter(item => {
                    const album = db.prepare("SELECT category FROM albums WHERE id=?").get(item.albumId) as {category:string|null}|undefined
                    return album && ["new","growing","comfort-food","classic"].includes(album.category ?? "")
                })
                if (!availableItems.length) throw new Error("NO_AVAILABLE_ALBUMS")
                savePlanTx({
                    id:draftId,name:`${source.name} — Draft`,targetSize:source.targetSize,
                    items:availableItems.map(({albumId,role,reason})=>({albumId,role,reason})),
                    albumIds:availableItems.map(item=>item.albumId),roleQuotas:source.roleQuotas,
                    createdAt,status:"draft",focusAlbumId:null,
                })
                return this.findDraft()!
            })()
        },
        setFocus(albumId: string | null): RotationPlan {
            const active = this.findActive()
            if (!active) throw new Error("NO_ACTIVE_ROTATION")
            if (albumId && !active.albumIds.includes(albumId)) throw new Error("FOCUS_NOT_IN_ACTIVE_ROTATION")
            db.prepare("UPDATE rotation_plans SET focus_album_id=? WHERE id=?").run(albumId, active.id)
            return this.findActive()!
        },
        saveListenEvent(event: ListenEvent): void {
            saveListenEventTx(event)
        },
        findListenEvents(limit = 1_000, offset = 0): ListenEvent[] {
            return (db.prepare(`${listenSelect} ORDER BY l.listened_at DESC, l.id DESC LIMIT ? OFFSET ?`).all(limit, offset) as Parameters<typeof hydrateListen>[0][]).map(hydrateListen)
        },
        findListenEvent(id:string):ListenEvent|null {
            const row=db.prepare(`${listenSelect} WHERE l.id=?`).get(id) as Parameters<typeof hydrateListen>[0]|undefined
            return row?hydrateListen(row):null
        },
        saveJournal(id:string,input:Pick<ListeningJournalEntry,"note"|"moodTags"|"contextTags">):ListenEvent {
            const event=this.findListenEvent(id)
            if(!event)throw new Error("LISTEN_EVENT_NOT_FOUND")
            const now=new Date().toISOString(),createdAt=event.journal?.createdAt??now
            db.prepare(`INSERT INTO listening_journal_entries (listen_event_id,note,mood_tags_json,context_tags_json,created_at,updated_at)
                VALUES (?,?,?,?,?,?) ON CONFLICT(listen_event_id) DO UPDATE SET note=excluded.note,mood_tags_json=excluded.mood_tags_json,
                context_tags_json=excluded.context_tags_json,updated_at=excluded.updated_at`).run(id,input.note,JSON.stringify(input.moodTags),JSON.stringify(input.contextTags),createdAt,now)
            return this.findListenEvent(id)!
        },
        deleteJournal(id:string):ListenEvent {
            if(!this.findListenEvent(id))throw new Error("LISTEN_EVENT_NOT_FOUND")
            db.prepare("DELETE FROM listening_journal_entries WHERE listen_event_id=?").run(id)
            return this.findListenEvent(id)!
        },
        findSettings(): RotationSettings {
            const row = db.prepare("SELECT target_size, role_quotas_json FROM rotation_settings WHERE singleton = 1").get() as { target_size: number; role_quotas_json: string }
            return { targetSize: row.target_size, roleQuotas: JSON.parse(row.role_quotas_json) as RotationSettings["roleQuotas"] }
        },
        saveSettings(settings: RotationSettings): RotationSettings {
            db.prepare("UPDATE rotation_settings SET target_size = ?, role_quotas_json = ?, updated_at = ? WHERE singleton = 1")
                .run(settings.targetSize, JSON.stringify(settings.roleQuotas), new Date().toISOString())
            return this.findSettings()
        },
    }
}

export type RotationStateRepository = ReturnType<typeof createRotationStateRepository>
