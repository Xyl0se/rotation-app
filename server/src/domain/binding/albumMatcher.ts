/** Album-Matching-Heuristik: verbindet Rotation-Album-Titel mit gescannten Ordnern */

export interface AlbumCandidate {
    albumId: string
    relativePath: string
    artistName: string
    albumName: string
}

export interface MatchResult {
    libraryAlbumId: string
    candidateAlbumId: string
    relativePath: string
    score: number
    source: "exact" | "case-insensitive" | "normalized"
}

function normalize(s: string): string {
    return s
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")
        .replace(/\s+/g, "")
}

export function matchAlbumToFolder(
    libraryAlbumId: string,
    albumTitle: string,
    albumArtist: string | undefined,
    candidates: AlbumCandidate[],
): MatchResult | null {
    const searchKey = albumArtist
        ? `${albumArtist}/${albumTitle}`
        : albumTitle

    const normalizedSearch = normalize(searchKey)

    // 1. Exact match on relativePath
    const exact = candidates.find((c) => c.relativePath === searchKey)
    if (exact) {
        return {
            libraryAlbumId,
            candidateAlbumId: exact.albumId,
            relativePath: exact.relativePath,
            score: 1.0,
            source: "exact",
        }
    }

    // 2. Case-insensitive match
    const lowerSearch = searchKey.toLowerCase()
    const ciMatch = candidates.find(
        (c) => c.relativePath.toLowerCase() === lowerSearch,
    )
    if (ciMatch) {
        return {
            libraryAlbumId,
            candidateAlbumId: ciMatch.albumId,
            relativePath: ciMatch.relativePath,
            score: 0.95,
            source: "case-insensitive",
        }
    }

    // 3. Normalized match (ignores punctuation/spaces/case)
    const normMatch = candidates.find(
        (c) => normalize(c.relativePath) === normalizedSearch,
    )
    if (normMatch) {
        return {
            libraryAlbumId,
            candidateAlbumId: normMatch.albumId,
            relativePath: normMatch.relativePath,
            score: 0.9,
            source: "normalized",
        }
    }

    return null
}

export function suggestBindings(
    albumLibrary: Array<{ id: string; title: string; artist: string | undefined }>,
    scannedFolders: AlbumCandidate[],
): MatchResult[] {
    const results: MatchResult[] = []
    const usedPaths = new Set<string>()

    for (const album of albumLibrary) {
        const available = scannedFolders.filter((c) => !usedPaths.has(c.relativePath))
        const match = matchAlbumToFolder(album.id, album.title, album.artist, available)
        if (match) {
            results.push(match)
            usedPaths.add(match.relativePath)
        }
    }

    return results
}
