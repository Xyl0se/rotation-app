/**
 * Album API service for server-side library persistence.
 */

import { get, post, put, del } from "./apiClient.js"
import type { Album } from "../../types/album.js"

export async function fetchAlbums(): Promise<Album[]> {
    return get<Album[]>("/albums")
}

export async function fetchAlbum(id: string): Promise<Album> {
    return get<Album>(`/albums/${encodeURIComponent(id)}`)
}

export async function createAlbum(album: Album): Promise<Album> {
    return post<Album>("/albums", album)
}

export async function updateAlbum(album: Album): Promise<Album> {
    return put<Album>(`/albums/${encodeURIComponent(album.id)}`, album)
}

export async function deleteAlbum(id: string): Promise<void> {
    return del(`/albums/${encodeURIComponent(id)}`)
}
