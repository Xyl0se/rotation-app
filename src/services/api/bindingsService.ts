/**
 * High-level bindings API service.
 * Bridges the Rotation backend with the frontend domain.
 */

import { get, post, del } from "./apiClient.js"

export interface Binding {
    albumId: string
    relativePath: string
    state: "proposed" | "confirmed" | "missing"
    matchSource: string | null
    proposedAt: string | null
    confirmedAt: string | null
    folderExists: boolean
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

export async function confirmBinding(albumId: string): Promise<Binding> {
    return post<Binding>("/bindings/confirm", { albumId })
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
