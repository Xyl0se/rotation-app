import { createContext, useContext } from "react"

export interface ConnectionState {
    isOnline: boolean
    apiReachable: boolean | null
    isRetrying: boolean
    retryCount: number
    lastError: string | null
    lastApiCheckAt: string | null
}

export const ConnectionContext = createContext<ConnectionState>({
    isOnline: true,
    apiReachable: null,
    isRetrying: false,
    retryCount: 0,
    lastError: null,
    lastApiCheckAt: null,
})

export function useConnection() {
    return useContext(ConnectionContext)
}
