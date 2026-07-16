import type { RefObject } from "react"
import { roles } from "../../../domain/roles"
import type { LibraryFilters, LibraryQuickView } from "../../../domain/library-search/libraryFilters"
import { useI18n } from "../../../i18n/useI18n"

type Props = {
    filters: LibraryFilters
    onChange: (filters: LibraryFilters) => void
    onReset: () => void
    resultCount: number
    totalCount: number
    searchRef: RefObject<HTMLInputElement | null>
}

export default function LibraryControls({
    filters, onChange, onReset, resultCount, totalCount, searchRef,
}: Props) {
    const { t } = useI18n()
    const update = <K extends keyof LibraryFilters>(key: K, value: LibraryFilters[K]) =>
        onChange({ ...filters, [key]: value })
    const toggleQuickView = (quickView: Exclude<LibraryQuickView, "none">) =>
        update("quickView", filters.quickView === quickView ? "none" : quickView)

    return (
        <section className="library-controls" aria-label={t.library.controls.label}>
            <div className="library-search-row">
                <label className="library-search">
                    <span>{t.library.controls.searchLabel}</span>
                    <input
                        ref={searchRef}
                        type="search"
                        aria-label={t.library.controls.searchLabel}
                        value={filters.query}
                        onChange={event => update("query", event.target.value)}
                        placeholder={t.library.controls.searchPlaceholder}
                    />
                    <kbd>/</kbd>
                </label>
                <p className="library-result-count" aria-live="polite">
                    {t.library.controls.resultCount(resultCount, totalCount)}
                </p>
            </div>

            <div className="library-filter-grid">
                <label>
                    <span>{t.library.controls.role}</span>
                    <select value={filters.role} onChange={event => update("role", event.target.value as LibraryFilters["role"])}>
                        <option value="all">{t.library.controls.allRoles}</option>
                        <option value="none">{t.library.controls.noRole}</option>
                        {roles.map(role => (
                            <option key={role.id} value={role.id}>{t.roles[role.id].title}</option>
                        ))}
                    </select>
                </label>
                <label>
                    <span>{t.library.controls.archive}</span>
                    <select value={filters.archive} onChange={event => update("archive", event.target.value as LibraryFilters["archive"])}>
                        <option value="all">{t.library.controls.allAlbums}</option>
                        <option value="active">{t.library.controls.activeOnly}</option>
                        <option value="archived">{t.library.controls.archivedOnly}</option>
                    </select>
                </label>
                <label>
                    <span>{t.library.controls.listening}</span>
                    <select value={filters.listening} onChange={event => update("listening", event.target.value as LibraryFilters["listening"])}>
                        <option value="all">{t.library.controls.anyListening}</option>
                        <option value="never">{t.library.controls.neverListened}</option>
                    </select>
                </label>
                <label>
                    <span>{t.library.controls.yearFrom}</span>
                    <input type="number" inputMode="numeric" min="1000" max="9999" value={filters.yearFrom}
                        onChange={event => update("yearFrom", event.target.value)} placeholder="1950" />
                </label>
                <label>
                    <span>{t.library.controls.yearTo}</span>
                    <input type="number" inputMode="numeric" min="1000" max="9999" value={filters.yearTo}
                        onChange={event => update("yearTo", event.target.value)} placeholder="2026" />
                </label>
            </div>

            <div className="library-quick-row">
                <div className="library-quick-views" aria-label={t.library.controls.quickViews}>
                    <button type="button" aria-pressed={filters.quickView === "never-listened"}
                        onClick={() => toggleQuickView("never-listened")}
                        title={t.library.controls.neverListenedRule}>
                        {t.library.controls.neverListened}
                    </button>
                    <button type="button" aria-pressed={filters.quickView === "recently-archived"}
                        onClick={() => toggleQuickView("recently-archived")}
                        title={t.library.controls.recentlyArchivedRule}>
                        {t.library.controls.recentlyArchived}
                    </button>
                </div>
                <button type="button" className="library-reset" onClick={onReset}>
                    {t.library.controls.reset}
                </button>
            </div>
            {filters.quickView !== "none" && (
                <p className="library-rule-explanation">
                    {filters.quickView === "never-listened"
                        ? t.library.controls.neverListenedRule
                        : t.library.controls.recentlyArchivedRule}
                </p>
            )}
        </section>
    )
}
