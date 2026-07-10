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

        title:
            "Hast du dieses Album mindestens dreimal bewusst gehört?",

        description:
            "Erst nach mehreren Durchgängen entsteht meist ein belastbarer Eindruck.",

    },

    wouldMissAlbum: {

        id: "wouldMissAlbum",

        title:
            "Würdest du dieses Album vermissen, wenn es morgen nicht mehr verfügbar wäre?",

        description:
            "Diese Frage hilft dabei, die emotionale Bindung zu erkennen.",

    },

    stillReturningConsciously: {

        id: "stillReturningConsciously",

        title:
            "Kehrst du heute noch bewusst zu diesem Album zurück?",

        description:
            "Diese Frage unterscheidet zwischen einer aktiven und einer ruhenden Beziehung.",

    },

    shapedTasteLongterm: {

        id: "shapedTasteLongterm",

        title:
            "Hat dieses Album dich über längere Zeit begleitet oder deinen Musikgeschmack geprägt?",

        description:
            "Persönliche Klassiker bleiben auch dann bestehen, wenn sie gerade weniger häufig gespielt werden.",

    },

    comfortAlbum: {

        id: "comfortAlbum",

        title:
            "Greifst du manchmal ganz automatisch zu diesem Album, ohne lange über deine Musikauswahl nachzudenken?",

        description:
            "Comfort-Food-Alben fühlen sich vertraut an und begleiten dich zuverlässig.",

    },

    surprisedOnLastListen: {

        id: "surprisedOnLastListen",

        title:
            "Hat dich das Album beim letzten bewussten Hören überrascht oder herausgefordert?",

        description:
            "Manche Alben wachsen mit jedem Hören weiter.",

    },

    musicallyValued: {

        id: "musicallyValued",

        title:
            "Schätzt du es musikalisch weiterhin sehr?",

        description:
            "Hohe musikalische Wertschätzung reicht für Bewunderung, auch ohne aktive Rückkehr.",

    },

    memoryOfEarlierPhase: {

        id: "memoryOfEarlierPhase",

        title:
            "Ist es vor allem Erinnerung an eine frühere Phase?",

        description:
            "Manche Alben bleiben wichtig, ohne aktuell eine musikalische Rolle zu spielen.",

    },

}
