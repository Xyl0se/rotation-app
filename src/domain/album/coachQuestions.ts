import type { AlbumCoachAnswers } from "./determineRole"

export type CoachQuestionId = keyof AlbumCoachAnswers

export interface CoachQuestion {
    id: CoachQuestionId
    title: string
    description?: string
}

export const coachQuestions: Record<
    CoachQuestionId,
    CoachQuestion
> = {
    heardThreeTimes: {
        id: "heardThreeTimes",
        title: "Have you listened to this album at least three times consciously?",
        description:
            "Only after several listens does a reliable impression usually form.",
    },

    wouldMissAlbum: {
        id: "wouldMissAlbum",
        title: "Would you miss this album if it were no longer available tomorrow?",
        description:
            "This question helps recognize the emotional connection.",
    },

    stillReturningConsciously: {
        id: "stillReturningConsciously",
        title: "Do you still consciously return to this album today?",
        description:
            "This question distinguishes between an active and a resting relationship.",
    },

    shapedTasteLongterm: {
        id: "shapedTasteLongterm",
        title: "Has this album accompanied you over a longer period or shaped your taste in music?",
        description:
            "Personal classics persist even when played less frequently.",
    },

    comfortAlbum: {
        id: "comfortAlbum",
        title: "Do you sometimes reach for this album completely automatically, without thinking much about your music choice?",
        description:
            "Comfort-food albums feel familiar and accompany you reliably.",
    },

    surprisedOnLastListen: {
        id: "surprisedOnLastListen",
        title: "Did the album surprise or challenge you during the last conscious listen?",
        description:
            "Some albums keep growing with every listen.",
    },

    musicallyValued: {
        id: "musicallyValued",
        title: "Do you still value it musically very much?",
        description:
            "High musical appreciation is enough for admiration, even without active return.",
    },

    memoryOfEarlierPhase: {
        id: "memoryOfEarlierPhase",
        title: "Is it mainly a memory of an earlier phase?",
        description:
            "Some albums remain important without currently playing a musical role.",
    },
}
