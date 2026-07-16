import OfflineIndicator from "../ui/OfflineIndicator"
import { useI18n } from "../../i18n/useI18n"

export type AppPage = "home" | "bindings" | "export" | "settings"

export default function AppHeader({ page, onNavigate }: { page: AppPage; onNavigate: (page: AppPage) => void }) {
    const { t } = useI18n()
    const entries: Array<[AppPage, string]> = [["home", t.nav.home], ["bindings", t.nav.bindings], ["export", t.nav.export], ["settings", t.nav.settings]]
    return <header className="app-header">
        <button className="product-mark" onClick={() => onNavigate("home")} aria-label={t.header.title}>
            <svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="18"/><circle cx="24" cy="24" r="5"/><path d="M36 10a19 19 0 0 1 5 11"/></svg>
            <span>{t.header.title}</span>
        </button>
        <nav className="app-nav" aria-label={t.header.title}>
            <OfflineIndicator />
            {entries.map(([id, label]) => <button key={id} className={page === id ? "active" : ""} onClick={() => onNavigate(id)}>{label}</button>)}
        </nav>
    </header>
}
