import { useState } from "react"

import HomePage from "./pages/HomePage"
import WelcomePage from "./pages/WelcomePage"

import { STORAGE } from "./config/storage"
import { createLocalStorageAdapter } from "./adapters/localStorageAdapter"
import { runMigrations } from "./config/migrations"

function App() {
    const adapter = createLocalStorageAdapter()

    runMigrations(adapter)

    const [showWelcome, setShowWelcome] = useState(() => {
        return adapter.get(STORAGE.ONBOARDING) !== "true"
    })

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

    return <HomePage adapter={adapter} />
}

export default App
