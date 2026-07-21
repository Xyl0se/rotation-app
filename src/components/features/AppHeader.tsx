import OfflineIndicator from "../ui/OfflineIndicator"
import { useI18n } from "../../i18n/useI18n"

export type AppPage = "home" | "bindings" | "export" | "insights" | "history" | "settings"

export default function AppHeader({ page, onNavigate, orphanCount = 0 }: { page: AppPage; onNavigate: (page: AppPage) => void; orphanCount?: number }) {
    const { t } = useI18n()
    const entries: Array<[AppPage, string]> = [
        ["home", t.nav.home],
        ["insights", t.nav.insights],
        ["export", t.nav.export],
        ["bindings", t.nav.bindings],
        ["settings", t.nav.settings],
    ]
    return <header className="app-header">
        <button className="product-mark" onClick={() => onNavigate("home")} aria-label={t.header.title}>
            <img src="/logo.svg" alt="" className="product-mark__logo" aria-hidden="true" width="28" height="28" />
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
