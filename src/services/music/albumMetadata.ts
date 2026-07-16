import {
    searchMusicBrainz,
} from "./providers/musicBrainz"

import {
    getCoverUrl,
    getReleaseGroupCoverUrl,
} from "./providers/coverArtArchive"

export interface AlbumMetadata {

    title: string

    artist: string

    year?: string

    coverUrl?: string

    musicBrainzId?: string

    coverCandidates?: string[]

}

function filesystemTitleVariants(title: string): string[] {
    const variants = [
        title,
        title.replaceAll("_", ": "),
        title.replaceAll("_", " – "),
        title.replaceAll("_", " "),
    ].map(value => value.replace(/\s+/g, " ").trim())
    return [...new Set(variants)]
}

function wordsOnly(title: string): string {
    return title
        .normalize("NFKD")
        .replace(/\p{Mark}/gu, "")
        .replace(/[^\p{Letter}\p{Number}]+/gu, " ")
        .trim()
        .replace(/\s+/g, " ")
}

/**
 * Public interface
 * for album metadata.
 *
 * React components exclusively
 * call this function.
 */
export async function searchAlbum(

    title: string,

    artist: string,

): Promise<AlbumMetadata | null> {

    let result = { releases: [] } as Awaited<ReturnType<typeof searchMusicBrainz>>
    const variants = filesystemTitleVariants(title)
    for (const variant of variants) {
        result = await searchMusicBrainz(variant, artist)
        if (result.releases.length > 0) break
    }

    if (result.releases.length === 0) {
        result = await searchMusicBrainz(wordsOnly(variants.at(-1) ?? title), artist, "words")
    }

    if (result.releases.length === 0) {

        return null

    }

    const release =
        result.releases[0]

    const coverCandidates = result.releases
        .slice(0, 3)
        .map(candidate => getCoverUrl(candidate.id))
    const releaseGroupId = release["release-group"]?.id
    if (releaseGroupId) coverCandidates.push(getReleaseGroupCoverUrl(releaseGroupId))

    return {

        title: release.title,

        artist,

        year: release.date?.slice(0, 4),

        musicBrainzId: release.id,

        coverUrl: coverCandidates[0],
        coverCandidates: [...new Set(coverCandidates)].slice(0, 4),

    }

}
