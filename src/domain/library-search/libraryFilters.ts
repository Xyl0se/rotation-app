import type { RoleId } from "../roles"
import type { ListenEvent } from "../listening/listenEvents"
import type { Album } from "../../types/album"

export type RoleFilter = "all" | "none" | RoleId
export type ArchiveFilter = "all" | "active" | "archived"
export type ListeningFilter = "all" | "never"
export type LibraryQuickView = "none" | "never-listened" | "recently-archived"

export interface LibraryFilters {
    query: string
    role: RoleFilter
    archive: ArchiveFilter
    yearFrom: string
    yearTo: string
    listening: ListeningFilter
    quickView: LibraryQuickView
}

export const emptyLibraryFilters: LibraryFilters = {
    query: "",
    role: "all",
    archive: "all",
    yearFrom: "",
    yearTo: "",
    listening: "all",
    quickView: "none",
}

export function normalizeLibraryText(value: string): string {
    return value
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLocaleLowerCase()
        .replace(/\s+/g, " ")
        .trim()
}

function searchableAlbumText(album: Album): string {
    return normalizeLibraryText([
        album.title,
        album.artist,
        album.story?.memoryNote,
        album.story?.acquiredBecause,
        album.story?.lifePhase,
    ].filter(Boolean).join(" "))
}

function parsedYear(value: string): number | null {
    const match = value.match(/\d{4}/)
    return match ? Number(match[0]) : null
}

function hasListening(album: Album, listenedAlbumIds: Set<string>): boolean {
    return album.listenCount > 0 || listenedAlbumIds.has(album.id)
}

function wasRecentlyArchived(album: Album, now: Date): boolean {
    if (album.category !== "archive") return false
    const archivedAt = album.roleHistory
        .filter(entry => entry.role === "archive")
        .map(entry => Date.parse(entry.recordedAt))
        .filter(Number.isFinite)
        .sort((a, b) => b - a)[0]
    if (archivedAt === undefined) return false
    const age = now.getTime() - archivedAt
    return age >= 0 && age <= 30 * 24 * 60 * 60 * 1000
}

export function filterLibraryAlbums(
    albums: Album[],
    filters: LibraryFilters,
    listenEvents: ListenEvent[] = [],
    now = new Date(),
): Album[] {
    const query = normalizeLibraryText(filters.query)
    const from = parsedYear(filters.yearFrom)
    const to = parsedYear(filters.yearTo)
    const listenedAlbumIds = new Set(listenEvents.map(event => event.albumId))

    return albums.filter(album => {
        if (query && !searchableAlbumText(album).includes(query)) return false
        if (filters.role === "none" && album.category !== undefined) return false
        if (filters.role !== "all" && filters.role !== "none" && album.category !== filters.role) return false
        if (filters.archive === "active" && album.category === "archive") return false
        if (filters.archive === "archived" && album.category !== "archive") return false

        const year = parsedYear(album.year)
        if (from !== null && (year === null || year < from)) return false
        if (to !== null && (year === null || year > to)) return false

        const neverListened = !hasListening(album, listenedAlbumIds)
        if (filters.listening === "never" && !neverListened) return false
        if (filters.quickView === "never-listened" && !neverListened) return false
        if (filters.quickView === "recently-archived" && !wasRecentlyArchived(album, now)) return false
        return true
    })
}

export function hasActiveLibraryFilters(filters: LibraryFilters): boolean {
    return Object.entries(filters).some(([key, value]) =>
        value !== emptyLibraryFilters[key as keyof LibraryFilters],
    )
}
