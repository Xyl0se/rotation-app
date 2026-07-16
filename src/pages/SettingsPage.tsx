import { useCallback, useEffect, useMemo, useState } from "react"
import Button from "../components/ui/Button"
import { LanguageSwitcher } from "../components/features/LanguageSwitcher"
import { useI18n } from "../i18n/useI18n"
import { fetchRotationSettings, saveRotationSettings, type RotationSettings } from "../services/api/rotationStateService"
import type { RoleId } from "../domain/roles"
import { fetchAuditEvents, fetchUndoPreview, undoLastAuditEvent, type AuditEvent } from "../services/api/auditService"

const roles: RoleId[] = ["new", "comfort-food", "classic", "growing"]

export default function SettingsPage() {
    const { t } = useI18n()
    const [settings, setSettings] = useState<RotationSettings | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)
    const [auditEvents,setAuditEvents]=useState<AuditEvent[]>([])
    const [undoCandidate,setUndoCandidate]=useState<AuditEvent|null>(null)
    const [confirmingUndo,setConfirmingUndo]=useState(false)

    const load = useCallback(async () => {
        try { setSettings(await fetchRotationSettings()); setError(null) }
        catch (cause) { setError(cause instanceof Error ? cause.message : t.settings.loadError) }
    }, [t.settings.loadError])
    const loadAudit = useCallback(async () => {
        const result = await fetchAuditEvents()
        setAuditEvents(result.events)
        setUndoCandidate(await fetchUndoPreview().catch(() => null))
    }, [])
    useEffect(() => { queueMicrotask(() => { void load(); void loadAudit().catch(()=>undefined) }) }, [load, loadAudit])

    const quotaSum = useMemo(() => settings?.roleQuotas.reduce((sum, quota) => sum + quota.targetCount, 0) ?? 0, [settings])
    const undoRole = undoCandidate?.before.category
        ? ({
            new: t.roles.new.title,
            "comfort-food": t.roles["comfort-food"].title,
            classic: t.roles.classic.title,
            growing: t.roles.growing.title,
            admire: t.roles.admire.title,
            archive: t.roles.archive.title,
        } as Record<string, string>)[undoCandidate.before.category] ?? undoCandidate.before.category
        : "—"
    function setQuota(role: RoleId, targetCount: number) {
        setSettings(current => current ? { ...current, roleQuotas: current.roleQuotas.map(quota => quota.role === role ? { ...quota, targetCount } : quota) } : current)
    }
    async function save() {
        if (!settings) return
        setSaving(true)
        try { setSettings(await saveRotationSettings(settings)); setError(null) }
        catch (cause) { setError(cause instanceof Error ? cause.message : t.settings.saveError) }
        finally { setSaving(false) }
    }

    return <main className="settings-workspace">
        <section className="settings-console">
            <p className="settings-kicker">{t.settings.kicker}</p>
            <h1>{t.settings.title}</h1>
            <p>{t.settings.description}</p>
            <div className="settings-module">
                <h2>{t.language.label}</h2><LanguageSwitcher />
            </div>
            <div className="settings-module">
                <h2>{t.settings.composition}</h2>
                {!settings ? <Button onClick={() => void load()}>{t.common.loading}</Button> : <>
                    <label>{t.settings.maximum}<input type="number" min="1" max="100" value={settings.targetSize} onChange={event => setSettings({ ...settings, targetSize: Number(event.target.value) })} /></label>
                    <div className="settings-quota-grid">
                        {roles.map(role => <label key={role}>{t.roles[role].title}<input type="number" min="0" max="100" value={settings.roleQuotas.find(quota => quota.role === role)?.targetCount ?? 0} onChange={event => setQuota(role, Number(event.target.value))} /></label>)}
                    </div>
                    <p className={quotaSum === settings.targetSize ? "settings-sum" : "settings-sum settings-sum--warning"}>{t.settings.quotaSum(quotaSum, settings.targetSize)}</p>
                    <p className="settings-hint">{t.settings.appliesNext}</p>
                    <Button onClick={() => void save()} disabled={saving}>{saving ? t.settings.saving : t.settings.save}</Button>
                </>}
                {error && <p className="settings-error" role="alert">{error}</p>}
            </div>
            <div className="settings-module"><h2>{t.settings.undoTitle}</h2><p>{t.settings.undoDescription}</p>
                {undoCandidate && <p>{t.settings.undoPreview(undoCandidate.before.title ?? undoCandidate.entityId, undoRole)}</p>}
                <Button variant="secondary" disabled={!undoCandidate || !auditEvents.some(event=>!event.undoneAt)} onClick={()=>setConfirmingUndo(true)}>{t.settings.undo}</Button>
                {confirmingUndo && undoCandidate && <div role="dialog" aria-modal="true" aria-label={t.settings.undoConfirmTitle} className="rotation-handover">
                    <h3>{t.settings.undoConfirmTitle}</h3>
                    <p>{t.settings.undoPreview(undoCandidate.before.title ?? undoCandidate.entityId, undoRole)}</p>
                    <div className="player-rotation-actions">
                        <Button variant="secondary" onClick={()=>setConfirmingUndo(false)}>{t.exportPage.cancel}</Button>
                        <Button onClick={async () => {
                            try {
                                await undoLastAuditEvent()
                                await loadAudit()
                                setConfirmingUndo(false)
                                setError(null)
                            } catch (cause) {
                                setError(cause instanceof Error ? cause.message : t.settings.undoError)
                            }
                        }}>{t.settings.undoConfirm}</Button>
                    </div>
                </div>}
            </div>
        </section>
    </main>
}
