export type MainViewMode = "all" | "roles" | "perspectives"

export type PerspectiveMode = "artist" | "year" | "lastListened" | "roleChange"

type LibraryViewSwitcherProps = {
    viewMode: MainViewMode
    perspectiveMode?: PerspectiveMode
    onChange: (mode: MainViewMode) => void
    onPerspectiveChange?: (mode: PerspectiveMode) => void
}

function LibraryViewSwitcher({
    viewMode,
    perspectiveMode = "artist",
    onChange,
    onPerspectiveChange,
}: LibraryViewSwitcherProps) {

    return (
        <div className="library-view-switcher-wrapper">
            <div
                className="library-view-switcher"
                role="tablist"
                aria-label="Bibliotheksansicht"
            >
                <button
                    className={
                        viewMode === "all"
                            ? "view-switcher-button active"
                            : "view-switcher-button"
                    }
                    onClick={() => onChange("all")}
                    role="tab"
                    aria-selected={viewMode === "all"}
                >
                    Alle Alben
                </button>
                <button
                    className={
                        viewMode === "roles"
                            ? "view-switcher-button active"
                            : "view-switcher-button"
                    }
                    onClick={() => onChange("roles")}
                    role="tab"
                    aria-selected={viewMode === "roles"}
                >
                    Rollen
                </button>
                <button
                    className={
                        viewMode === "perspectives"
                            ? "view-switcher-button active"
                            : "view-switcher-button"
                    }
                    onClick={() => onChange("perspectives")}
                    role="tab"
                    aria-selected={viewMode === "perspectives"}
                >
                    Perspektiven
                </button>
            </div>

            {viewMode === "perspectives" && onPerspectiveChange && (
                <div
                    className="perspective-switcher"
                    role="tablist"
                    aria-label="Perspektive"
                >
                    <button
                        className={
                            perspectiveMode === "artist"
                                ? "perspective-button active"
                                : "perspective-button"
                        }
                        onClick={() => onPerspectiveChange("artist")}
                        role="tab"
                        aria-selected={perspectiveMode === "artist"}
                    >
                        Künstler
                    </button>
                    <button
                        className={
                            perspectiveMode === "year"
                                ? "perspective-button active"
                                : "perspective-button"
                        }
                        onClick={() => onPerspectiveChange("year")}
                        role="tab"
                        aria-selected={perspectiveMode === "year"}
                    >
                        Jahre
                    </button>
                    <button
                        className={
                            perspectiveMode === "lastListened"
                                ? "perspective-button active"
                                : "perspective-button"
                        }
                        onClick={() => onPerspectiveChange("lastListened")}
                        role="tab"
                        aria-selected={perspectiveMode === "lastListened"}
                    >
                        Hörsession
                    </button>
                    <button
                        className={
                            perspectiveMode === "roleChange"
                                ? "perspective-button active"
                                : "perspective-button"
                        }
                        onClick={() => onPerspectiveChange("roleChange")}
                        role="tab"
                        aria-selected={perspectiveMode === "roleChange"}
                    >
                        Zuletzt eingeordnet
                    </button>
                </div>
            )}
        </div>
    )

}

export default LibraryViewSwitcher
