/**
 * Album API service for server-side library persistence.
 */

import { get, post, put, del } from "./apiClient.js"
import type { Album, AlbumSource } from "../../types/album.js"

export interface MusicBrainzReleaseCandidate { releaseId: string; releaseGroupId?: string; title: string; artist: string; year?: string }

export async function fetchAlbums(): Promise<Album[]> {
    return get<Album[]>("/albums")
}

export async function fetchAlbum(id: string): Promise<Album> {
    return get<Album>(`/albums/${encodeURIComponent(id)}`)
}

export async function createAlbum(album: Album, coverCandidates: string[] = []): Promise<Album> {
    return post<Album>("/albums", { ...album, coverCandidates })
}

export async function updateAlbum(album: Album): Promise<Album> {
    return put<Album>(`/albums/${encodeURIComponent(album.id)}`, album)
}

export async function deleteAlbum(id: string): Promise<void> {
    return del(`/albums/${encodeURIComponent(id)}`)
}

export const searchAlbumSources = (id: string): Promise<{ candidates: MusicBrainzReleaseCandidate[] }> =>
    post(`/albums/${encodeURIComponent(id)}/sources/search`)

export const previewAlbumSources = (id: string, candidate: Pick<MusicBrainzReleaseCandidate, "releaseId" | "releaseGroupId">): Promise<{ sources: AlbumSource[] }> =>
    post(`/albums/${encodeURIComponent(id)}/sources/preview`, candidate)

export const saveAlbumSources = (id: string, sources: AlbumSource[]): Promise<Album> =>
    put(`/albums/${encodeURIComponent(id)}/sources`, { sources })
