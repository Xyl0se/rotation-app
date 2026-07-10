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
    Record<ArchiveReturnQuestionId, ArchiveReturnQuestion> = {

    heardLastSixMonths: {

        type: "boolean",

        id: "heardLastSixMonths",

        title:
            "Hast du dieses Album in den letzten 6 Monaten mindestens einmal bewusst gehört?",

        description:
            "Wenn es noch aktiv auftaucht, darf es im Archiv weiter ruhig bleiben.",

    },

    remembersMoment: {

        type: "boolean",

        id: "remembersMoment",

        title:
            "Erinnerst du dich spontan an einen Song, ein Riff, eine Textzeile oder einen besonderen Moment?",

        description:
            "Wiederentdeckung beginnt oft mit einem kleinen, klaren Erinnerungsfunken.",

    },

    wouldDefendAlbum: {

        type: "boolean",

        id: "wouldDefendAlbum",

        title:
            "Würdest du jemandem widersprechen, der sagt: 'Das Album ist eigentlich ziemlich durchschnittlich'?",

        description:
            "Wenn du es verteidigen würdest, ist es vielleicht ein Klassiker.",

    },

    reason: {

        type: "choice",

        id: "reason",

        title:
            "Warum hast du dieses Album damals gekauft?",

        description:
            "Die Antwort verändert nicht allein die Rolle, hilft aber beim Erinnern.",

        options: [

            {
                value: "recommendation",
                label: "Empfehlung oder Jahresliste",
            },

            {
                value: "artist",
                label: "Band oder Künstler geliebt",
            },

            {
                value: "curiosity",
                label: "Neugier, Cover oder Impulskauf",
            },

        ],

    },

    fitsCurrentMood: {

        type: "boolean",

        id: "fitsCurrentMood",

        title:
            "Passt dieses Album zu deiner aktuellen Lebensphase oder Hörstimmung?",

        description:
            "Nicht jedes gute Album muss gerade zurück in die Rotation.",

    },

    listeningNeed: {

        type: "choice",

        id: "listeningNeed",

        title:
            "Suchst du heute eher Vertrautheit oder Entdeckung?",

        description:
            "Vertrautheit führt eher zum Klassiker, Entdeckung eher zu 'Wächst noch'.",

        options: [

            {
                value: "familiarity",
                label: "Vertrautheit",
            },

            {
                value: "discovery",
                label: "Entdeckung",
            },

        ],

    },

}
