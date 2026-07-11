import { useI18n } from "../../../i18n/I18nContext"

export type MainViewMode = "all" | "roles" | "perspectives"
export type PerspectiveMode = "artist" | "year" | "lastListened" | "roleChange"

type LibraryViewSwitcherProps = {
    viewMode: MainViewMode
    perspectiveMode: PerspectiveMode
    onChange: (mode: MainViewMode) => void
    onPerspectiveChange: (mode: PerspectiveMode) => void
}

function LibraryViewSwitcher({
    viewMode,
    perspectiveMode,
    onChange,
    onPerspectiveChange,
}: LibraryViewSwitcherProps) {
    const { t } = useI18n()

    const mainViews: { mode: MainViewMode; label: string }[] = [
        { mode: "all", label: t.library.views.all },
        { mode: "roles", label: t.library.views.byRole },
        { mode: "perspectives", label: t.library.views.perspectives },
    ]

    const perspectives: { mode: PerspectiveMode; label: string }[] = [
        { mode: "artist", label: t.library.views.artist },
        { mode: "year", label: t.library.views.year },
        { mode: "lastListened", label: t.library.views.lastListened },
        { mode: "roleChange", label: t.library.views.roleChange },
    ]

    return (
        <div className="library-view-switcher">
            <div className="library-view-switcher-main">
                {mainViews.map(({ mode, label }) => (
                    <button
                        key={mode}
                        className={viewMode === mode ? "active" : ""}
                        onClick={() => onChange(mode)}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {viewMode === "perspectives" && (
                <div className="library-view-switcher-sub">
                    {perspectives.map(({ mode, label }) => (
                        <button
                            key={mode}
                            className={perspectiveMode === mode ? "active" : ""}
                            onClick={() => onPerspectiveChange(mode)}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}

export default LibraryViewSwitcher
