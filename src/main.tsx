import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import "./styles/bindings.css"
import App from "./App.tsx"
import { I18nProvider } from "./i18n/I18nProvider.tsx"
import { ConnectionProvider } from "./contexts/ConnectionContext.tsx"
import { ToastProvider } from "./contexts/ToastContext.tsx"
import { ErrorBoundary } from "./components/ui/ErrorBoundary.tsx"
import { BindingsProvider } from "./contexts/BindingsProvider.tsx"
import { AlbumSessionProvider } from "./contexts/AlbumSessionProvider.tsx"

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <ErrorBoundary>
            <I18nProvider>
                <ConnectionProvider>
                    <ToastProvider>
                        <BindingsProvider>
                            <AlbumSessionProvider>
                                <App />
                            </AlbumSessionProvider>
                        </BindingsProvider>
                    </ToastProvider>
                </ConnectionProvider>
            </I18nProvider>
        </ErrorBoundary>
    </StrictMode>
)
