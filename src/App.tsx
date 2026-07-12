import { useState } from "react"

import HomePage from "./pages/HomePage"
import WelcomePage from "./pages/WelcomePage"
import BindingsPage from "./pages/BindingsPage"
import ExportPage from "./pages/ExportPage"

import { STORAGE } from "./config/storage"
import { createLocalStorageAdapter } from "./adapters/localStorageAdapter"
import { runMigrations } from "./config/migrations"
import { useI18n } from "./i18n/useI18n"

type Page = "home" | "bindings" | "export"

function App() {
    const adapter = createLocalStorageAdapter()
    const { t } = useI18n()

    runMigrations(adapter)

    const [showWelcome, setShowWelcome] = useState(() => {
        return adapter.get(STORAGE.ONBOARDING) !== "true"
    })
    const [page, setPage] = useState<Page>("home")

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
            {page === "home" && <HomePage adapter={adapter} />}
            {page === "bindings" && <BindingsPage />}
            {page === "export" && <ExportPage />}
        </>
    )
}

export default App
