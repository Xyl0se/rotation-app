import { post } from "./apiClient.js"

export interface ScanResponse {
    scanId: string
    status: string
}

export async function triggerScan(): Promise<ScanResponse> {
    return post<ScanResponse>("/scan")
}
