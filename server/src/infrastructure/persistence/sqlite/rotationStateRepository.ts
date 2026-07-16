import Database from "better-sqlite3"
import type { ListenEvent, RotationPlan, RotationSettings } from "../../../domain/rotationTypes.js"

export function createRotationStateRepository(db: Database.Database) {
    const saveListen = db.prepare("INSERT INTO listen_events VALUES (?,?,?) ON CONFLICT(id) DO NOTHING")
    const savePlanTx = db.transaction((plan: RotationPlan) => {
        // Accepting a Rotation replaces every previous proposal/active selection.
        // Keeping the former active plan as a draft made reload prefer that stale
        // proposal over the newly accepted plan.
        if (plan.status === "active") db.prepare("DELETE FROM rotation_plans WHERE id != ?").run(plan.id)
        db.prepare(`INSERT INTO rotation_plans (id,name,target_size,role_quotas_json,status,focus_album_id,created_at,accepted_at)
            VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,target_size=excluded.target_size,
            role_quotas_json=excluded.role_quotas_json,status=excluded.status,focus_album_id=NULL,
            accepted_at=excluded.accepted_at`).run(
            plan.id, plan.name, plan.targetSize, JSON.stringify(plan.roleQuotas), plan.status,
            null, plan.createdAt, plan.acceptedAt ?? null,
        )
        db.prepare("DELETE FROM rotation_plan_items WHERE rotation_plan_id = ?").run(plan.id)
        const insert = db.prepare("INSERT INTO rotation_plan_items VALUES (?,?,?,?,?)")
        plan.items.forEach((item, position) => insert.run(plan.id, item.albumId, position, item.role, item.reason))
        if (plan.focusAlbumId) {
            const member = plan.items.some(item => item.albumId === plan.focusAlbumId)
            if (!member || plan.status !== "active") throw new Error("FOCUS_NOT_IN_ACTIVE_ROTATION")
            db.prepare("UPDATE rotation_plans SET focus_album_id = ? WHERE id = ?").run(plan.focusAlbumId, plan.id)
        }
    })
    const importLegacyTx = db.transaction((draft: RotationPlan | null, active: RotationPlan | null, events: ListenEvent[]) => {
        const existingIds = (db.prepare("SELECT id FROM rotation_plans").all() as Array<{ id: string }>).map(row => row.id)
        const incomingIds = new Set([draft?.id, active?.id].filter((id): id is string => Boolean(id)))
        if (existingIds.some(id => !incomingIds.has(id))) throw new Error("SERVER_ROTATION_STATE_EXISTS")
        if (draft) savePlanTx(draft)
        if (active) savePlanTx(active)
        events.forEach(event => saveListen.run(event.id, event.albumId, event.listenedAt))
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
        const items = db.prepare("SELECT album_id,role,reason FROM rotation_plan_items WHERE rotation_plan_id=? ORDER BY position")
            .all(row.id as string) as Array<{ album_id: string; role: RotationPlan["items"][number]["role"]; reason: RotationPlan["items"][number]["reason"] }>
        return {
            id: row.id as string, name: row.name as string, targetSize: row.target_size as number,
            roleQuotas: JSON.parse(row.role_quotas_json as string) as RotationPlan["roleQuotas"],
            status: row.status as RotationPlan["status"], focusAlbumId: row.focus_album_id as string | null,
            createdAt: row.created_at as string, acceptedAt: row.accepted_at as string | undefined,
            items: items.map(item => ({ albumId: item.album_id, role: item.role, reason: item.reason })),
            albumIds: items.map(item => item.album_id),
        }
    }

    return {
        savePlan(plan: RotationPlan): void { savePlanTx(plan) },
        findActive(): RotationPlan | null { return hydrate(db.prepare("SELECT * FROM rotation_plans WHERE status='active'").get() as Record<string, unknown> | undefined) },
        findDraft(): RotationPlan | null { return hydrate(db.prepare("SELECT * FROM rotation_plans WHERE status='draft' ORDER BY created_at DESC LIMIT 1").get() as Record<string, unknown> | undefined) },
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
        findListenEvents(): ListenEvent[] {
            return (db.prepare("SELECT id,album_id,listened_at FROM listen_events ORDER BY listened_at").all() as Array<{id:string;album_id:string;listened_at:string}>)
                .map(row => ({ id: row.id, albumId: row.album_id, listenedAt: row.listened_at }))
        },
        importLegacy(draft: RotationPlan | null, active: RotationPlan | null, events: ListenEvent[]): void {
            importLegacyTx(draft, active, events)
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
