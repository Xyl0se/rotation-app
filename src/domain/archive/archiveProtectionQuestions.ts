import type {
    ArchiveProtectionQuestionId,
} from "./evaluateArchiveProtection"

export interface ArchiveProtectionQuestion {
    id: ArchiveProtectionQuestionId
    title: string
    description: string
}

export const archiveProtectionQuestions:
    Record<
        ArchiveProtectionQuestionId,
        ArchiveProtectionQuestion
    > = {
    hasBiographicPlace: {
        id: "hasBiographicPlace",
        title: "Does this album have a permanent place in your musical biography?",
        description:
            "A personal classic can rest currently and still remain a classic.",
    },

    stillReturningConsciously: {
        id: "stillReturningConsciously",
        title: "Do you still consciously return to this album today?",
        description:
            "If you still actively reach for it, perhaps it's admiration rather than archive.",
    },

    musicallyValued: {
        id: "musicallyValued",
        title: "Do you still value it musically very much?",
        description:
            "High musical appreciation is enough for admiration, even without active return.",
    },
}
