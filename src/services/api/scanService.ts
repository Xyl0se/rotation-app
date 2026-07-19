import { post, get } from "./apiClient.js"

export interface ScanResponse {
    scanId: string
    status: string
    coverResolution?: {
        attempted: number
        local: number
        cached: number
        missing: number
        failed: number
    }
}

export interface ScanProgressResponse {
    scanId: string
    directoriesScanned: number
    directoriesSkipped: number
    status: string
}

export async function triggerScan(): Promise<ScanResponse> {
    return post<ScanResponse>("/scan")
}

export async function getScanProgress(scanId: string): Promise<ScanProgressResponse> {
    return get<ScanProgressResponse>(`/scan/${scanId}/progress`)
}
