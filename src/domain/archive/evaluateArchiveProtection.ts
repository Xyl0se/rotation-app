import type { RoleId } from "../roles"

export interface ArchiveProtectionAnswers {

    hasBiographicPlace: boolean

    stillReturningConsciously: boolean

    musicallyValued: boolean

}

export type ArchiveProtectionQuestionId =
    keyof ArchiveProtectionAnswers

export type ArchiveProtectionEvaluation =
    | {
          finished: false
          nextQuestion: ArchiveProtectionQuestionId
      }
    | {
          finished: true
          role: RoleId
      }

/**
 * Der Archivschutz verhindert, dass Alben mit
 * dauerhafter biografischer Bedeutung vorschnell
 * archiviert werden.
 *
 * Ein persönlicher Klassiker kann aktuell ruhen
 * und trotzdem ein Klassiker bleiben.
 * Deshalb prüft dieser Flow zuerst die
 * dauerhafte Bedeutung, nicht die aktuelle
 * Höraktivität.
 */
export function evaluateArchiveProtection(
    answers: Partial<ArchiveProtectionAnswers>,
): ArchiveProtectionEvaluation {

    if (answers.hasBiographicPlace === undefined) {

        return {

            finished: false,

            nextQuestion: "hasBiographicPlace",

        }

    }

    if (answers.hasBiographicPlace) {

        return {

            finished: true,

            role: "classic",

        }

    }

    if (answers.stillReturningConsciously === undefined) {

        return {

            finished: false,

            nextQuestion: "stillReturningConsciously",

        }

    }

    if (answers.stillReturningConsciously) {

        return {

            finished: true,

            role: "admire",

        }

    }

    if (answers.musicallyValued === undefined) {

        return {

            finished: false,

            nextQuestion: "musicallyValued",

        }

    }

    return {

        finished: true,

        role: answers.musicallyValued
            ? "admire"
            : "archive",

    }

}
