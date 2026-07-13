import { createContext, useCallback, useContext, useEffect, useState } from "react"
import type { ReactNode } from "react"
import { setRetryReporter } from "../services/api/retryFetch"

export interface ConnectionState {
    isOnline: boolean
    isRetrying: boolean
    retryCount: number
    lastError: string | null
}

const ConnectionContext = createContext<ConnectionState>({
    isOnline: true,
    isRetrying: false,
    retryCount: 0,
    lastError: null,
})

export function useConnection() {
    return useContext(ConnectionContext)
}

export function ConnectionProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<ConnectionState>({
        isOnline: navigator.onLine,
        isRetrying: false,
        retryCount: 0,
        lastError: null,
    })

    const handleOnline = useCallback(() => {
        setState((s) => ({ ...s, isOnline: true, lastError: null }))
    }, [])

    const handleOffline = useCallback(() => {
        setState((s) => ({ ...s, isOnline: false, isRetrying: false, retryCount: 0 }))
    }, [])

    useEffect(() => {
        const reporter = {
            onRetrying: (attempt: number) => {
                setState((s) => ({
                    ...s,
                    isRetrying: true,
                    retryCount: attempt,
                }))
            },
            onOnline: () => {
                setState((s) => ({
                    ...s,
                    isOnline: true,
                    isRetrying: false,
                    retryCount: 0,
                    lastError: null,
                }))
            },
            onOffline: () => {
                setState((s) => ({
                    ...s,
                    isOnline: false,
                    isRetrying: false,
                    retryCount: 0,
                }))
            },
            onError: (message: string) => {
                setState((s) => ({
                    ...s,
                    isRetrying: false,
                    retryCount: 0,
                    lastError: message,
                }))
            },
        }

        setRetryReporter(reporter)

        window.addEventListener("online", handleOnline)
        window.addEventListener("offline", handleOffline)

        return () => {
            setRetryReporter(null)
            window.removeEventListener("online", handleOnline)
            window.removeEventListener("offline", handleOffline)
        }
    }, [handleOnline, handleOffline])

    return (
        <ConnectionContext.Provider value={state}>
            {children}
        </ConnectionContext.Provider>
    )
}
