import { useCallback, useEffect, useRef, useState } from "react"
import type { ReactNode } from "react"
import { setRetryReporter } from "../services/api/retryFetch"
import { probeApi } from "../services/api/apiClient"
import { ConnectionContext } from "./connectionState"
import type { ConnectionState } from "./connectionState"

export function ConnectionProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<ConnectionState>({
        isOnline: navigator.onLine,
        apiReachable: null,
        isRetrying: false,
        retryCount: 0,
        lastError: null,
        lastApiCheckAt: null,
    })
    const retryingRequests = useRef(new Map<number, number>())

    const handleOnline = useCallback(() => {
        setState((s) => ({ ...s, isOnline: true, lastError: null }))
    }, [])

    const handleOffline = useCallback(() => {
        retryingRequests.current.clear()
        setState((s) => ({
            ...s,
            isOnline: false,
            apiReachable: false,
            isRetrying: false,
            retryCount: 0,
        }))
    }, [])

    useEffect(() => {
        let active = true
        let probeController: AbortController | null = null

        const checkApi = async () => {
            if (!navigator.onLine) return
            probeController?.abort()
            const controller = new AbortController()
            probeController = controller
            const timeout = window.setTimeout(() => controller.abort(), 3000)
            try {
                await probeApi(controller.signal)
                if (active) {
                    setState((s) => ({
                        ...s,
                        apiReachable: true,
                        lastApiCheckAt: new Date().toISOString(),
                    }))
                }
            } catch {
                if (active && !controller.signal.aborted) {
                    setState((s) => ({
                        ...s,
                        apiReachable: false,
                        lastApiCheckAt: new Date().toISOString(),
                    }))
                } else if (active) {
                    setState((s) => ({
                        ...s,
                        apiReachable: false,
                        lastApiCheckAt: new Date().toISOString(),
                    }))
                }
            } finally {
                window.clearTimeout(timeout)
            }
        }

        const settleRequest = (requestId: number) => {
            retryingRequests.current.delete(requestId)
            const attempts = [...retryingRequests.current.values()]
            return {
                isRetrying: attempts.length > 0,
                retryCount: attempts.length > 0 ? Math.max(...attempts) : 0,
            }
        }
        const reporter = {
            onRetrying: (requestId: number, attempt: number) => {
                retryingRequests.current.set(requestId, attempt)
                setState((s) => ({
                    ...s,
                    isRetrying: true,
                    retryCount: attempt,
                }))
            },
            onOnline: (requestId: number) => {
                const retryState = settleRequest(requestId)
                setState((s) => ({
                    ...s,
                    isOnline: true,
                    apiReachable: true,
                    ...retryState,
                    lastError: null,
                    lastApiCheckAt: new Date().toISOString(),
                }))
            },
            onOffline: (requestId: number) => {
                const retryState = settleRequest(requestId)
                setState((s) => ({
                    ...s,
                    isOnline: false,
                    apiReachable: false,
                    ...retryState,
                }))
            },
            onError: (requestId: number, message: string) => {
                const retryState = settleRequest(requestId)
                setState((s) => ({
                    ...s,
                    apiReachable: navigator.onLine ? false : s.apiReachable,
                    ...retryState,
                    lastError: message,
                }))
            },
        }

        setRetryReporter(reporter)

        window.addEventListener("online", handleOnline)
        window.addEventListener("offline", handleOffline)
        window.addEventListener("online", checkApi)
        void checkApi()
        const interval = window.setInterval(() => void checkApi(), 30_000)

        return () => {
            active = false
            probeController?.abort()
            window.clearInterval(interval)
            setRetryReporter(null)
            window.removeEventListener("online", handleOnline)
            window.removeEventListener("offline", handleOffline)
            window.removeEventListener("online", checkApi)
        }
    }, [handleOnline, handleOffline])

    return (
        <ConnectionContext.Provider value={state}>
            {children}
        </ConnectionContext.Provider>
    )
}
