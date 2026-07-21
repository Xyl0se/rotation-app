import { useEffect, useState } from "react"

import HomePage from "./pages/HomePage"
import WelcomePage from "./pages/WelcomePage"
import BindingsPage from "./pages/BindingsPage"
import ExportPage from "./pages/ExportPage"
import SettingsPage from "./pages/SettingsPage"
import RotationHistoryPage from "./pages/RotationHistoryPage"
import InsightsPage from "./pages/InsightsPage"
import AppHeader, { type AppPage } from "./components/features/AppHeader"
import ToastContainer from "./components/ui/Toast"
import AlbumSessionBand from "./components/features/playback/AlbumSessionBand"
import { useBindings } from "./hooks/useBindings"
import { albumDetailPath, albumIdFromPath } from "./routing/albumDetailRoute"

const ONBOARDING_KEY = "rotation-onboarding-complete"

function App() {
    const [showWelcome, setShowWelcome] = useState(() => {
        return localStorage.getItem(ONBOARDING_KEY) !== "true"
    })
    const [page, setPage] = useState<AppPage>("home")
    const [albumDetailId, setAlbumDetailId] = useState<string | null>(() => albumIdFromPath(window.location.pathname))
    const [highlightAlbumId, setHighlightAlbumId] = useState<string | null>(null)
    const { orphans, refresh: refreshBindings } = useBindings()

    useEffect(() => {
        const handlePopState = () => {
            setAlbumDetailId(albumIdFromPath(window.location.pathname))
            setPage("home")
        }
        window.addEventListener("popstate", handlePopState)
        return () => window.removeEventListener("popstate", handlePopState)
    }, [])

    function navigate(pageId: AppPage) {
        setPage(pageId)
        setAlbumDetailId(null)
        if (window.location.pathname !== "/") window.history.replaceState({}, "", "/")
    }

    function openAlbum(albumId: string) {
        setPage("home")
        setAlbumDetailId(albumId)
        window.history.pushState({}, "", albumDetailPath(albumId))
    }

    function closeAlbum() {
        setAlbumDetailId(null)
        window.history.replaceState({}, "", "/")
    }

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
            <AppHeader page={page} onNavigate={navigate} orphanCount={orphans.length} />
            {page === "home" && <HomePage onNavigateToBindings={() => navigate("bindings")} highlightAlbumId={highlightAlbumId} albumDetailId={albumDetailId} onOpenAlbum={openAlbum} onCloseAlbum={closeAlbum} />}
            {page === "bindings" && (
                <main className="bindings-workspace">
                    <BindingsPage onNavigateToLibrary={handleNavigateToLibrary} onBindingsChanged={refreshBindings} />
                </main>
            )}
            {page === "export" && (
                <main className="export-workspace">
                    <ExportPage />
                </main>
            )}
            {page === "settings" && <SettingsPage />}
            {page === "history" && <RotationHistoryPage />}
            {page === "insights" && <InsightsPage />}
            <AlbumSessionBand />
            <ToastContainer />
        </>
    )
}

export default App
