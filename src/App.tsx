import { useState } from "react"

import HomePage from "./pages/HomePage"
import WelcomePage from "./pages/WelcomePage"
import BindingsPage from "./pages/BindingsPage"
import ExportPage from "./pages/ExportPage"
import OfflineIndicator from "./components/ui/OfflineIndicator"
import ToastContainer from "./components/ui/Toast"

import { STORAGE } from "./config/storage"
import { createLocalStorageAdapter } from "./adapters/localStorageAdapter"
import { clearLegacyLibraryStorage, runMigrations } from "./config/migrations"
import { useI18n } from "./i18n/useI18n"

type Page = "home" | "bindings" | "export"

const adapter = createLocalStorageAdapter()
runMigrations(adapter)
clearLegacyLibraryStorage(adapter)

function App() {
    const { t } = useI18n()

    const [showWelcome, setShowWelcome] = useState(() => {
        return adapter.get(STORAGE.ONBOARDING) !== "true"
    })
    const [page, setPage] = useState<Page>("home")
    const [highlightAlbumId, setHighlightAlbumId] = useState<string | null>(null)

    function handleNavigateToLibrary(albumId: string) {
        setPage("home")
        setHighlightAlbumId(albumId)
    }

    function handleContinue() {
        adapter.set(STORAGE.ONBOARDING, "true")
        setShowWelcome(false)
    }

    if (showWelcome) {
        return (
            <WelcomePage
                onContinue={handleContinue}
            />
        )
    }

    return (
        <>
            <nav className="app-nav">
                <OfflineIndicator />
                <button
                    className={page === "home" ? "active" : ""}
                    onClick={() => setPage("home")}
                >
                    {t.nav.home}
                </button>
                <button
                    className={page === "bindings" ? "active" : ""}
                    onClick={() => setPage("bindings")}
                >
                    {t.nav.bindings}
                </button>
                <button
                    className={page === "export" ? "active" : ""}
                    onClick={() => setPage("export")}
                >
                    {t.nav.export}
                </button>
            </nav>
            {page === "home" && <HomePage adapter={adapter} onNavigateToBindings={() => setPage("bindings")} highlightAlbumId={highlightAlbumId} />}
            {page === "bindings" && <BindingsPage onNavigateToLibrary={handleNavigateToLibrary} />}
            {page === "export" && <ExportPage />}
            <ToastContainer />
        </>
    )
}

export default App
