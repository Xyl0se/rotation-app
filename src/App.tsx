import { useState } from "react"

import HomePage from "./pages/HomePage"
import WelcomePage from "./pages/WelcomePage"
import BindingsPage from "./pages/BindingsPage"
import ExportPage from "./pages/ExportPage"
import SettingsPage from "./pages/SettingsPage"
import RotationHistoryPage from "./pages/RotationHistoryPage"
import AppHeader, { type AppPage } from "./components/features/AppHeader"
import ToastContainer from "./components/ui/Toast"

const ONBOARDING_KEY = "rotation-onboarding-complete"

function App() {
    const [showWelcome, setShowWelcome] = useState(() => {
        return localStorage.getItem(ONBOARDING_KEY) !== "true"
    })
    const [page, setPage] = useState<AppPage>("home")
    const [highlightAlbumId, setHighlightAlbumId] = useState<string | null>(null)

    function handleNavigateToLibrary(albumId: string) {
        setPage("home")
        setHighlightAlbumId(albumId)
    }

    function handleContinue() {
        localStorage.setItem(ONBOARDING_KEY, "true")
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
            {page === "home" && <HomePage onNavigateToBindings={() => setPage("bindings")} highlightAlbumId={highlightAlbumId} />}
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
            {page === "history" && <RotationHistoryPage />}
            <ToastContainer />
        </>
    )
}

export default App
