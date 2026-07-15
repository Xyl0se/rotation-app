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
    issues?: Array<{
        albumId: string
        title?: string
        artist?: string
        reason: "album-not-found" | "binding-missing" | "binding-unconfirmed"
    }>
    canExport: boolean
}

export interface SkippedSource {
    albumId: string
    relativePath: string
    artistName: string
    albumName: string
}

export interface StagingProgress {
    status: "staging" | "staged" | "failed"
    filesCopied?: number
    totalFiles?: number
    error?: string
    skippedSources?: SkippedSource[]
}

export interface StartupRecoveryInfo {
    recovered: number
    cleanedStagingDirs: number
    cleanedArchives: number
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

export async function getStartupRecoveryInfo(): Promise<StartupRecoveryInfo> {
    return get<StartupRecoveryInfo>("/exports/startup-recovery")
}
