/**
 * Listening History
 *
 * Listen sessions are modeled as independent events.
 * Not embedded directly into the album, but kept as a global event log
 * in local storage.
 *
 * The listenCount and lastListened fields on the album remain as
 * mirrored derivations — so existing components and domain logic
 * continue to function.
 */

export interface ListenEvent {

    id: string

    albumId: string

    listenedAt: string

}
