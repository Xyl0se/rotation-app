import { get, post } from "./apiClient.js"

export interface ExportPreviewResult {
    exportId: string
    albumCount: number
    totalSizeBytes: number
    fileCount: number
    sources: Array<{
        albumId: string
        relativePath: string
        artistName: string
        albumName: string
        absolutePath: string
    }>
    missingBindings: string[]
    unconfirmedBindings: string[]
    canExport: boolean
}

export interface StagingProgress {
    status: "staging" | "staged" | "failed"
    filesCopied?: number
    totalFiles?: number
    error?: string
}

export interface ApplyResult {
    exportId: string
    status: string
    exportPath: string
    archivePath: string | null
}

export async function createExportPreview(albumIds: string[]): Promise<ExportPreviewResult> {
    return post<ExportPreviewResult>("/exports/preview", { albumIds })
}

export async function stageExport(exportId: string, albumIds: string[]): Promise<{ exportId: string; status: string }> {
    return post<{ exportId: string; status: string }>("/exports/stage", { exportId, albumIds })
}

export async function getExportStatus(exportId: string): Promise<StagingProgress> {
    return get<StagingProgress>(`/exports/${encodeURIComponent(exportId)}/status`)
}

export async function applyExport(exportId: string): Promise<ApplyResult> {
    return post<ApplyResult>("/exports/apply", { exportId })
}
