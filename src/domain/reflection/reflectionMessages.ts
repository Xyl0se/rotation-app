import type {
    ReflectionPrompt,
} from "./evaluateReflection"

export interface ReflectionMessage {

    title: string

    description: string

    actionLabel: string

}

export function getReflectionMessage(
    prompt: ReflectionPrompt,
): ReflectionMessage {

    switch (prompt.code) {

        case "new-after-listens":
            return {

                title:
                    "Vielleicht ist dieses Album nicht mehr neu",

                description:
                    "Du hast es inzwischen mehrmals gehört. Vielleicht hat es heute schon eine klarere Rolle in deiner Rotation.",

                actionLabel:
                    "Neu einordnen",

            }

        case "growing-for-a-while":
            return {

                title:
                    "Wächst dieses Album noch?",

                description:
                    "Dieses Album liegt schon eine Weile in der Rolle 'Wächst noch'. Ein neuer Blick kann zeigen, ob es dort noch richtig aufgehoben ist.",

                actionLabel:
                    "Neu einordnen",

            }

        case "comfort-not-recent":
            return {

                title:
                    "Ist das noch Comfort Food?",

                description:
                    "Dieses Album war vertraut, wurde aber länger nicht gehört. Vielleicht ist seine Rolle heute eine andere.",

                actionLabel:
                    "Neu einordnen",

            }

        case "archive-return-candidate":
            return {

                title:
                    "Kandidat für Wiederentdeckung?",

                description:
                    "Dieses Album ruht schon länger im Archiv. Vielleicht lohnt sich ein vorsichtiger Blick darauf, ob es heute wieder in deine Rotation passt.",

                actionLabel:
                    "Wiederentdeckung prüfen",

            }

    }

}
