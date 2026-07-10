/**
 * Ermittelt die URL des Frontcovers
 * für eine MusicBrainz Release-ID.
 */
export function getCoverUrl(

    musicBrainzId: string,

): string {

    return `https://coverartarchive.org/release/${musicBrainzId}/front`

}