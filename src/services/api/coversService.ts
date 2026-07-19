/**
 * Cover API service for server-side cover storage.
 */

import { postRaw, del, get, post } from "./apiClient.js"

export type CoverResolutionStatus = "cached" | "not-found" | "temporarily-unavailable" | "invalid-image"
export type CoverResolutionSource = "folder" | "embedded" | "upload" | "alternative" | "remote" | "cache" | "placeholder"
export interface CoverResolutionResult { status: CoverResolutionStatus; source?: CoverResolutionSource | null }
export interface CoverResolutionDiagnostics extends CoverResolutionResult {
    lastResolutionAt: string | null
    resolvedAt: string | null
    candidateCount: number
    hasCachedCover: boolean
    source: CoverResolutionSource | null
    failureCode: "local-artwork-not-found" | "remote-not-found" | "remote-temporarily-unavailable" | "invalid-image" | null
    sizeBytes: number | null
    mimeType: "image/jpeg" | "image/png" | "image/webp" | "image/gif" | null
    width: number | null
    height: number | null
}

export async function fetchCoverUrl(albumId: string): Promise<string | null> {
    try {
        const response = await fetch(`/api/covers/${encodeURIComponent(albumId)}`)
        if (!response.ok) {
            return null
        }
        const blob = await response.blob()
        return URL.createObjectURL(blob)
    } catch {
        return null
    }
}

export async function uploadCover(albumId: string, arrayBuffer: ArrayBuffer, contentType: string): Promise<void> {
    return postRaw(`/covers/${encodeURIComponent(albumId)}`, arrayBuffer, contentType)
}

export async function deleteCover(albumId: string): Promise<void> {
    return del(`/covers/${encodeURIComponent(albumId)}`)
}

export async function resolveServerCover(
    albumId: string,
    sourceUrls: string | string[],
    forceRefresh = false,
): Promise<CoverResolutionResult> {
    return post<CoverResolutionResult>(`/covers/${encodeURIComponent(albumId)}/resolve`, {
        sourceUrls: Array.isArray(sourceUrls) ? sourceUrls : [sourceUrls],
        forceRefresh,
    })
}

export async function fetchCoverResolutionStatus(albumId: string): Promise<CoverResolutionDiagnostics> {
    return get<CoverResolutionDiagnostics>(`/covers/${encodeURIComponent(albumId)}/status`)
}
