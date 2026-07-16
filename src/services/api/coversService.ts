/**
 * Cover API service for server-side cover storage.
 */

import { postRaw, del } from "./apiClient.js"

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

export async function resolveServerCover(albumId: string, sourceUrl: string): Promise<void> {
    return postRaw(`/covers/${encodeURIComponent(albumId)}/resolve`, new TextEncoder().encode(sourceUrl).buffer, "text/plain")
}
