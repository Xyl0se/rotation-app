import { useCallback, useEffect, useMemo, useState } from "react"
import Button from "../components/ui/Button"
import { LanguageSwitcher } from "../components/features/LanguageSwitcher"
import { useI18n } from "../i18n/useI18n"
import { fetchRotationSettings, saveRotationSettings, type RotationSettings } from "../services/api/rotationStateService"
import type { RoleId } from "../domain/roles"

const roles: RoleId[] = ["new", "comfort-food", "classic", "growing"]

export default function SettingsPage() {
    const { t } = useI18n()
    const [settings, setSettings] = useState<RotationSettings | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)

    const load = useCallback(async () => {
        try { setSettings(await fetchRotationSettings()); setError(null) }
        catch (cause) { setError(cause instanceof Error ? cause.message : t.settings.loadError) }
    }, [t.settings.loadError])
    useEffect(() => { queueMicrotask(() => void load()) }, [load])

    const quotaSum = useMemo(() => settings?.roleQuotas.reduce((sum, quota) => sum + quota.targetCount, 0) ?? 0, [settings])
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
        </section>
    </main>
}
