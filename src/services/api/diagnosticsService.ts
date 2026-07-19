import { get, post } from "./apiClient.js"

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

export interface ArtworkProbeSample {
    format: "mp3" | "m4a" | "flac"
    audioBytes: number
    elapsedMs: number
    rssDeltaBytes: number
    parserFormat: string | null
    pictureCount: number
    coverBytes: number | null
    withinCoverBudget: boolean | null
    outcome: "cover" | "no-cover" | "parse-error"
    failureCode?: "invalid-media"
}

export interface ArtworkFeasibilityReport {
    generatedAt: string
    bindingsInspected: number
    missingFormats: Array<"mp3" | "m4a" | "flac">
    samples: ArtworkProbeSample[]
}

export async function runArtworkFeasibility(): Promise<ArtworkFeasibilityReport> {
    return post<ArtworkFeasibilityReport>("/diagnostics/artwork-feasibility")
}
