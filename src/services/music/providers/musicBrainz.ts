export interface MusicBrainzRelease {

    id: string

    title: string

    date?: string

}

interface MusicBrainzApiResponse {

    releases: MusicBrainzRelease[]

}

/**
 * Searches for an album via MusicBrainz.
 *
 * This file encapsulates all communication
 * with the MusicBrainz API.
 */
export async function searchMusicBrainz(

    title: string,

    artist: string,

): Promise<MusicBrainzApiResponse> {

    const query = encodeURIComponent(

        `release:"${title}" AND artist:"${artist}"`

    )

    const response = await fetch(

        `https://musicbrainz.org/ws/2/release?fmt=json&query=${query}`,

        {

            headers: {

                Accept: "application/json",

            },

        },

    )

    if (!response.ok) {

        throw new Error(

            `MusicBrainz request failed (${response.status})`

        )

    }

    return response.json()

}