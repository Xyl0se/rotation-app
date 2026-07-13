import { get } from "./apiClient.js"

export interface DiagnosticsResponse {
    connectivity: {
        api: boolean
        database: boolean
    }
    filesystem: {
        musicPath: {
            configured: string
            exists: boolean
            readable: boolean
            albumFoldersFound: number
        }
        workspacePath: {
            configured: string
            exists: boolean
            writable: boolean
        }
        syncthingRoot: {
            configured: string
            exists: boolean
            writable: boolean
        }
    }
    bindings: {
        total: number
        proposed: number
        confirmed: number
        missing: number
        lastScanAt: string | null
        lastScanStatus: string | null
        lastScanAlbumFoldersFound: number
    }
    rotation: {
        hasActivePlan: boolean
    }
}

export async function fetchDiagnostics(): Promise<DiagnosticsResponse> {
    return get<DiagnosticsResponse>("/diagnostics")
}
