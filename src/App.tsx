import { useState } from "react"

import HomePage from "./pages/HomePage"
import WelcomePage from "./pages/WelcomePage"
import BindingsPage from "./pages/BindingsPage"
import ExportPage from "./pages/ExportPage"
import SettingsPage from "./pages/SettingsPage"
import AppHeader, { type AppPage } from "./components/features/AppHeader"
import ToastContainer from "./components/ui/Toast"

import { STORAGE } from "./config/storage"
import { createLocalStorageAdapter } from "./adapters/localStorageAdapter"
import { clearLegacyLibraryStorage, runMigrations } from "./config/migrations"

const adapter = createLocalStorageAdapter()
runMigrations(adapter)
clearLegacyLibraryStorage(adapter)

function App() {
    const [showWelcome, setShowWelcome] = useState(() => {
        return adapter.get(STORAGE.ONBOARDING) !== "true"
    })
    const [page, setPage] = useState<AppPage>("home")
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
            <AppHeader page={page} onNavigate={setPage} />
            {page === "home" && <HomePage adapter={adapter} onNavigateToBindings={() => setPage("bindings")} highlightAlbumId={highlightAlbumId} />}
            {page === "bindings" && (
                <main className="bindings-workspace">
                    <BindingsPage onNavigateToLibrary={handleNavigateToLibrary} />
                </main>
            )}
            {page === "export" && (
                <main className="export-workspace">
                    <ExportPage />
                </main>
            )}
            {page === "settings" && <SettingsPage />}
            <ToastContainer />
        </>
    )
}

export default App
