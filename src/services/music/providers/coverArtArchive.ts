/**
 * Determines the URL of the front cover
 * for a MusicBrainz release ID.
 */
export function getCoverUrl(

    musicBrainzId: string,

): string {

    return `https://coverartarchive.org/release/${musicBrainzId}/front`

}