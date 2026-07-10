/**
 * Der Album Coach ist das Herzstück von Rotation.
 *
 * Diese Datei beschreibt den vollständigen
 * Entscheidungsbaum, mit dem Rotation gemeinsam
 * mit dem Nutzer die aktuelle Rolle eines Albums
 * bestimmt.
 *
 * Änderungen an dieser Datei verändern bewusst
 * die Philosophie des Produkts.
 */

import type { RoleId } from "../roles"
import type { AlbumCoachAnswers } from "./determineRole"

export type CoachQuestionId =
    | "heardThreeTimes"
    | "wouldMissAlbum"
    | "stillReturningConsciously"
    | "shapedTasteLongterm"
    | "comfortAlbum"
    | "surprisedOnLastListen"
    | "musicallyValued"
    | "memoryOfEarlierPhase"

export type CoachEvaluation =
    | {
          finished: false
          nextQuestion: CoachQuestionId
      }
    | {
          finished: true
          role: RoleId
      }

/**
 * Entscheidet anhand der bisherigen Antworten,
 * welche Frage als Nächstes gestellt werden muss
 * oder ob bereits eine Rolle eindeutig bestimmt
 * werden kann.
 *
 * Es werden ausschließlich die für den jeweiligen
 * Zweig erforderlichen Fragen gestellt.
 */
export function evaluateCoach(
    answers: AlbumCoachAnswers
): CoachEvaluation {

    // Frage 1
    if (answers.heardThreeTimes === undefined) {

        return {

            finished: false,

            nextQuestion: "heardThreeTimes",

        }

    }

    if (answers.heardThreeTimes === false) {

        return {

            finished: true,

            role: "new",

        }

    }

    // Frage 2
    if (answers.wouldMissAlbum === undefined) {

        return {

            finished: false,

            nextQuestion: "wouldMissAlbum",

        }

    }

    if (answers.wouldMissAlbum === false) {

        return {

            finished: true,

            role: "archive",

        }

    }

    // Frage 3: Aktive oder ruhende Beziehung?
    if (answers.stillReturningConsciously === undefined) {

        return {

            finished: false,

            nextQuestion: "stillReturningConsciously",

        }

    }

    if (answers.stillReturningConsciously === true) {

        // Aktiver Zweig
        if (answers.shapedTasteLongterm === undefined) {

            return {

                finished: false,

                nextQuestion: "shapedTasteLongterm",

            }

        }

        if (answers.shapedTasteLongterm === true) {

            return {

                finished: true,

                role: "classic",

            }

        }

        if (answers.comfortAlbum === undefined) {

            return {

                finished: false,

                nextQuestion: "comfortAlbum",

            }

        }

        if (answers.comfortAlbum === true) {

            return {

                finished: true,

                role: "comfort-food",

            }

        }

        if (answers.surprisedOnLastListen === undefined) {

            return {

                finished: false,

                nextQuestion: "surprisedOnLastListen",

            }

        }

        if (answers.surprisedOnLastListen === true) {

            return {

                finished: true,

                role: "growing",

            }

        }

        // Fallback: aktiv, aber weder prägend noch vertraut noch überraschend
        return {

            finished: true,

            role: "admire",

        }

    }

    if (answers.stillReturningConsciously === false) {

        // Ruhender Zweig
        if (answers.musicallyValued === undefined) {

            return {

                finished: false,

                nextQuestion: "musicallyValued",

            }

        }

        if (answers.musicallyValued === true) {

            return {

                finished: true,

                role: "admire",

            }

        }

        if (answers.memoryOfEarlierPhase === undefined) {

            return {

                finished: false,

                nextQuestion: "memoryOfEarlierPhase",

            }

        }

        // memoryOfEarlierPhase === true oder false → archive
        return {

            finished: true,

            role: "archive",

        }

    }

    throw new Error(
        "Unvollständige Antworten für evaluateCoach"
    )

}
