import type {
    ArchiveReturnListeningNeed,
    ArchiveReturnQuestionId,
    ArchiveReturnReason,
} from "./evaluateArchiveReturn"

type ArchiveReturnQuestion =
    | {
          type: "boolean"
          id: ArchiveReturnQuestionId
          title: string
          description: string
      }
    | {
          type: "choice"
          id: "reason"
          title: string
          description: string
          options: Array<{
              value: ArchiveReturnReason
              label: string
          }>
      }
    | {
          type: "choice"
          id: "listeningNeed"
          title: string
          description: string
          options: Array<{
              value: ArchiveReturnListeningNeed
              label: string
          }>
      }

export const archiveReturnQuestions:
    Record<
        ArchiveReturnQuestionId,
        ArchiveReturnQuestion
    > = {
    heardLastSixMonths: {
        type: "boolean",
        id: "heardLastSixMonths",
        title: "Have you listened to this album at least once consciously in the last 6 months?",
        description:
            "If it still appears actively, it may remain quietly in the archive.",
    },

    remembersMoment: {
        type: "boolean",
        id: "remembersMoment",
        title: "Do you spontaneously remember a song, a riff, a lyric line, or a special moment?",
        description:
            "Rediscovery often begins with a small, clear spark of memory.",
    },

    wouldDefendAlbum: {
        type: "boolean",
        id: "wouldDefendAlbum",
        title: 'Would you disagree with someone who says: "This album is actually pretty average"?',
        description:
            "If you would defend it, perhaps it's a classic.",
    },

    reason: {
        type: "choice",
        id: "reason",
        title: "Why did you acquire this album back then?",
        description:
            "The answer doesn't change the role alone, but helps with remembering.",
        options: [
            {
                value: "recommendation",
                label: "Recommendation or year-end list",
            },
            {
                value: "artist",
                label: "Loved the band or artist",
            },
            {
                value: "curiosity",
                label: "Curiosity, cover, or impulse buy",
            },
        ],
    },

    fitsCurrentMood: {
        type: "boolean",
        id: "fitsCurrentMood",
        title: "Does this album fit your current life phase or listening mood?",
        description:
            "Not every good album needs to return to the rotation right now.",
    },

    listeningNeed: {
        type: "choice",
        id: "listeningNeed",
        title: "Are you looking for familiarity or discovery today?",
        description:
            "Familiarity tends toward Classic, discovery tends toward Still Growing.",
        options: [
            {
                value: "familiarity",
                label: "Familiarity",
            },
            {
                value: "discovery",
                label: "Discovery",
            },
        ],
    },
}
