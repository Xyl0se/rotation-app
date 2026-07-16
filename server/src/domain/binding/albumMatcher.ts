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

export interface RankedBindingCandidate {
    libraryAlbumId: string
    title: string
    artist: string
    score: number
    confidence: "strong" | "possible" | "ambiguous"
    reasons: Array<"title-exact" | "title-similar" | "artist-exact" | "artist-similar" | "volume-conflict">
}

function normalize(s: string): string {
    return s
        .toLowerCase()
        .normalize("NFKD")
        .replace(/\p{Mark}/gu, "")
        .replace(/[^\p{Letter}\p{Number}]+/gu, " ")
        .trim()
        .replace(/\s+/g, " ")
}

function similarity(left: string, right: string): number {
    const a = normalize(left)
    const b = normalize(right)
    if (!a || !b) return 0
    if (a === b) return 1
    const previous = Array.from({ length: b.length + 1 }, (_, index) => index)
    for (let i = 1; i <= a.length; i++) {
        let diagonal = previous[0]!
        previous[0] = i
        for (let j = 1; j <= b.length; j++) {
            const above = previous[j]!
            previous[j] = Math.min(
                previous[j]! + 1,
                previous[j - 1]! + 1,
                diagonal + (a[i - 1] === b[j - 1] ? 0 : 1),
            )
            diagonal = above
        }
    }
    return 1 - previous[b.length]! / Math.max(a.length, b.length)
}

function volumeToken(value: string): string | null {
    const match = normalize(value).match(/(?:vol(?:ume)?|part)\s*(\d+|[ivxlcdm]+)/u)
    return match?.[1] ?? null
}

export function rankBindingCandidates(
    folder: Pick<AlbumCandidate, "albumName" | "artistName">,
    albums: Array<{ id: string; title: string; artist: string }>,
    limit = 3,
): RankedBindingCandidate[] {
    const ranked = albums.map((album) => {
        const titleScore = similarity(folder.albumName, album.title)
        const artistScore = similarity(folder.artistName, album.artist)
        const reasons: RankedBindingCandidate["reasons"] = []
        if (titleScore === 1) reasons.push("title-exact")
        else if (titleScore >= .62) reasons.push("title-similar")
        if (artistScore === 1) reasons.push("artist-exact")
        else if (artistScore >= .7) reasons.push("artist-similar")

        const folderVolume = volumeToken(folder.albumName)
        const albumVolume = volumeToken(album.title)
        const volumeConflict = Boolean(folderVolume && albumVolume && folderVolume !== albumVolume)
        if (volumeConflict) reasons.push("volume-conflict")
        const score = Math.max(0, titleScore * .65 + artistScore * .35 - (volumeConflict ? .35 : 0))
        return { album, score, reasons }
    }).filter(({ score, reasons }) => score >= .58 && reasons.length > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)

    return ranked.map(({ album, score, reasons }, index) => {
        const closeRunnerUp = index === 0 && ranked[1] && score - ranked[1].score < .06
        return {
            libraryAlbumId: album.id,
            title: album.title,
            artist: album.artist,
            score: Math.round(score * 1000) / 1000,
            confidence: closeRunnerUp ? "ambiguous" : score >= .86 ? "strong" : "possible",
            reasons,
        }
    })
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
