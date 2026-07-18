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

export type JournalMood = "calm" | "energized" | "melancholic" | "curious" | "nostalgic"
export type JournalContext = "focused" | "background" | "on-the-go" | "evening" | "shared"

export interface ListeningJournalEntry {
    note: string
    moodTags: JournalMood[]
    contextTags: JournalContext[]
    createdAt: string
    updatedAt: string
}

export interface ListenEvent {

    id: string

    albumId: string

    listenedAt: string

    journal?: ListeningJournalEntry

}
