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

        title:
            "Hat dieses Album einen dauerhaften Platz in deiner musikalischen Biografie?",

        description:
            "Ein persönlicher Klassiker kann aktuell ruhen und trotzdem ein Klassiker bleiben.",

    },

    stillReturningConsciously: {

        id: "stillReturningConsciously",

        title:
            "Kehrst du heute noch bewusst zu diesem Album zurück?",

        description:
            "Wenn du noch aktiv dorthin greifst, ist es vielleicht Bewunderung statt Archiv.",

    },

    musicallyValued: {

        id: "musicallyValued",

        title:
            "Schätzt du es musikalisch weiterhin sehr?",

        description:
            "Hohe musikalische Wertschätzung reicht für Bewunderung, auch ohne aktive Rückkehr.",

    },

}
