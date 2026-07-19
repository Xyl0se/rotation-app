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

export interface BindingCandidate {
    bindingAlbumId: string
    libraryAlbumId: string
    scanId: string
    rank: number
    score: number
    confidence: "strong" | "possible" | "ambiguous"
    reasons: Array<"title-exact" | "title-similar" | "artist-exact" | "artist-similar" | "volume-conflict">
    title: string
    artist: string
}

export async function fetchBindings(state?: "proposed" | "confirmed" | "missing"): Promise<BindingsListResponse> {
    const qs = state ? `?state=${state}` : ""
    return get<BindingsListResponse>(`/bindings${qs}`)
}

export async function fetchBindingByLibraryAlbumId(libraryAlbumId: string): Promise<Binding> {
    return get<Binding>(`/bindings/by-library-album/${encodeURIComponent(libraryAlbumId)}`)
}

export async function confirmBinding(albumId: string): Promise<Binding> {
    return post<Binding>("/bindings/confirm", { albumId })
}

export async function linkBinding(albumId: string, libraryAlbumId: string): Promise<Binding> {
    return post<Binding>("/bindings/link", { albumId, libraryAlbumId })
}

export async function captureBinding(
    albumId: string,
    album: Album,
    coverCandidates: string[] = [],
): Promise<{ album: Album; binding: Binding }> {
    return post<{ album: Album; binding: Binding }>(
        "/bindings/capture",
        { albumId, album, coverCandidates },
    )
}

export async function unlinkBinding(albumId: string): Promise<Binding> {
    return post<Binding>("/bindings/unlink", { albumId })
}

export async function deleteBinding(albumId: string): Promise<void> {
    const encoded = encodeURIComponent(albumId)
    return del(`/bindings?albumId=${encoded}`)
}

export async function verifyBindings(): Promise<VerifyResult> {
    return post<VerifyResult>("/bindings/verify")
}

export async function reconcileBindings(): Promise<ReconcileResult> {
    return post<ReconcileResult>("/bindings/reconcile")
}

export async function fetchOrphans(): Promise<BindingsListResponse> {
    return get<BindingsListResponse>("/bindings/orphans")
}

export async function fetchBindingCandidates(albumId: string): Promise<{ candidates: BindingCandidate[] }> {
    return get(`/bindings/${encodeURIComponent(albumId)}/candidates`)
}

export async function selectBindingCandidate(albumId: string, libraryAlbumId: string, scanId: string): Promise<Binding> {
    return post(`/bindings/${encodeURIComponent(albumId)}/select-candidate`, { libraryAlbumId, scanId })
}

export async function rejectBindingCandidates(albumId: string): Promise<void> {
    await post(`/bindings/${encodeURIComponent(albumId)}/reject-candidates`)
}

export async function selectBindingLibraryAlbum(albumId: string, libraryAlbumId: string): Promise<Binding> {
    return post(`/bindings/${encodeURIComponent(albumId)}/select-library-album`, { libraryAlbumId })
}
