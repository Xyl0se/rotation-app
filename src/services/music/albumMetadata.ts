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

    musicBrainzReleaseGroupId?: string

    coverCandidates?: string[]

}

export function metadataTitleVariants(title: string): string[] {
    const punctuationVariants=(value:string)=>[
        value,
        value.replace(/\s*\+\s*/g," & "),
        value.replace(/\s*\+\s*/g," and "),
        value.replace(/\s*[+&]\s*/g," "),
        value.replace(/[‐‑‒–—]/g,"-"),
        value.replace(/[’‘`]/g,"'"),
    ]
    const filesystemVariants = [
        title,
        title.replaceAll("_", ": "),
        title.replaceAll("_", " – "),
        title.replaceAll("_", " "),
    ]
    const variants=filesystemVariants.flatMap(punctuationVariants).map(value => value.normalize("NFC").replace(/\s+/g, " ").trim())
    return [...new Set(variants)].slice(0,8)
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
    const variants = metadataTitleVariants(title)
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
        musicBrainzReleaseGroupId: releaseGroupId,

        coverUrl: coverCandidates[0],
        coverCandidates: [...new Set(coverCandidates)].slice(0, 4),

    }

}
