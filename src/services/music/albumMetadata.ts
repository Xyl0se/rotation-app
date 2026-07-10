import {
    searchMusicBrainz,
} from "./providers/musicBrainz"

import {
    getCoverUrl,
} from "./providers/coverArtArchive"

export interface AlbumMetadata {

    title: string

    artist: string

    year?: string

    coverUrl?: string

    musicBrainzId?: string

}

/**
 * Öffentliche Schnittstelle
 * für Album-Metadaten.
 *
 * React-Komponenten sprechen ausschließlich
 * mit dieser Funktion.
 */
export async function searchAlbum(

    title: string,

    artist: string,

): Promise<AlbumMetadata | null> {

    const result =
        await searchMusicBrainz(

            title,

            artist,

        )

    if (result.releases.length === 0) {

        return null

    }

    const release =
        result.releases[0]

    return {

        title: release.title,

        artist,

        year: release.date?.slice(0, 4),

        musicBrainzId: release.id,

        coverUrl: getCoverUrl(
            release.id,
        ),

    }

}