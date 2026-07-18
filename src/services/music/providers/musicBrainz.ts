export interface MusicBrainzRelease {

    id: string

    title: string

    date?: string

    "release-group"?: { id: string }

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

    mode: "exact" | "words" = "exact",

): Promise<MusicBrainzApiResponse> {

    const escapeQueryValue = (value: string) => value.replace(/([+\-!(){}[\]^"~*?:\\/]|&&|\|\|)/g, "\\$1")
    const releaseQuery = mode === "exact"
        ? `release:"${escapeQueryValue(title)}"`
        : `release:${escapeQueryValue(title)}`
    const query = encodeURIComponent(

        `${releaseQuery} AND artist:"${escapeQueryValue(artist)}"`

    )

    const response = await fetch(

        `https://musicbrainz.org/ws/2/release?fmt=json&limit=5&query=${query}`,

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
