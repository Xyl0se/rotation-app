import OfflineIndicator from "../ui/OfflineIndicator"
import { useI18n } from "../../i18n/useI18n"

export type AppPage = "home" | "bindings" | "export" | "insights" | "history" | "settings"

export default function AppHeader({ page, onNavigate, orphanCount = 0 }: { page: AppPage; onNavigate: (page: AppPage) => void; orphanCount?: number }) {
    const { t } = useI18n()
    const entries: Array<[AppPage, string]> = [["home", t.nav.home], ["bindings", t.nav.bindings], ["export", t.nav.export], ["insights", t.nav.insights], ["history", t.nav.history], ["settings", t.nav.settings]]
    return <header className="app-header">
        <button className="product-mark" onClick={() => onNavigate("home")} aria-label={t.header.title}>
            <svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="18"/><circle cx="24" cy="24" r="5"/><path d="M36 10a19 19 0 0 1 5 11"/></svg>
            <span>{t.header.title}</span>
        </button>
        <nav className="app-nav" aria-label={t.header.title}>
            <OfflineIndicator />
            {entries.map(([id, label]) => {
                const showsAttention = id === "bindings" && orphanCount > 0
                return <button
                    key={id}
                    className={`${page === id ? "active" : ""}${showsAttention ? " app-nav-button--attention" : ""}`}
                    onClick={() => onNavigate(id)}
                    title={showsAttention ? t.nav.bindingsAttention(orphanCount) : undefined}
                    aria-label={showsAttention ? `${label}. ${t.nav.bindingsAttention(orphanCount)}` : label}
                >
                    {label}
                    {showsAttention && <span className="bindings-attention-dot" aria-hidden="true" />}
                </button>
            })}
        </nav>
    </header>
}
