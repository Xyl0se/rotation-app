/**
 * Determines the URL of the front cover
 * for a MusicBrainz release ID.
 */
export function getCoverUrl(

    musicBrainzId: string,

): string {

    return `https://coverartarchive.org/release/${musicBrainzId}/front`

}

export function getReleaseGroupCoverUrl(musicBrainzId: string): string {
    return `https://coverartarchive.org/release-group/${musicBrainzId}/front`
}
