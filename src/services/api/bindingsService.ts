/**
 * High-level bindings API service.
 * Bridges the Rotation backend with the frontend domain.
 */

import { get, post, del } from "./apiClient.js"
import type { Album } from "../../types/album.js"

export interface Binding {
    albumId: string
    relativePath: string
    state: "proposed" | "confirmed" | "missing"
    matchSource: string | null
    proposedAt: string | null
    confirmedAt: string | null
    libraryAlbumId: string | null
    folderExists: boolean
    libraryExists: boolean
    albumTitle?: string
    albumArtist?: string
    suggestedTitle?: string
    suggestedArtist?: string
}

export interface BindingsListResponse {
    bindings: Binding[]
    count: number
}

export interface VerifyResult {
    okCount: number
    missingCount: number
    missingIds: string[]
}

export interface ReconcileResult {
    promotedCount: number
    promotedIds: string[]
}

export async function fetchBindings(state?: "proposed" | "confirmed" | "missing"): Promise<BindingsListResponse> {
    const qs = state ? `?state=${state}` : ""
    return get<BindingsListResponse>(`/bindings${qs}`)
}

export async function fetchBindingByLibraryAlbumId(libraryAlbumId: string): Promise<Binding> {
    return get<Binding>(`/bindings/by-library-album/${encodeURIComponent(libraryAlbumId)}`)
}

export async function confirmBinding(albumId: string): Promise<Binding> {
    return post<Binding>("/bindings/confirm", { albumId }, true)
}

export async function linkBinding(albumId: string, libraryAlbumId: string): Promise<Binding> {
    return post<Binding>("/bindings/link", { albumId, libraryAlbumId }, true)
}

export async function captureBinding(
    albumId: string,
    album: Album,
): Promise<{ album: Album; binding: Binding }> {
    return post<{ album: Album; binding: Binding }>(
        "/bindings/capture",
        { albumId, album },
        true,
    )
}

export async function unlinkBinding(albumId: string): Promise<Binding> {
    return post<Binding>("/bindings/unlink", { albumId }, true)
}

export async function deleteBinding(albumId: string): Promise<void> {
    const encoded = encodeURIComponent(albumId)
    return del(`/bindings?albumId=${encoded}`, true)
}

export async function verifyBindings(): Promise<VerifyResult> {
    return post<VerifyResult>("/bindings/verify", undefined, true)
}

export async function reconcileBindings(): Promise<ReconcileResult> {
    return post<ReconcileResult>("/bindings/reconcile", undefined, true)
}

export async function fetchOrphans(): Promise<BindingsListResponse> {
    return get<BindingsListResponse>("/bindings/orphans")
}
