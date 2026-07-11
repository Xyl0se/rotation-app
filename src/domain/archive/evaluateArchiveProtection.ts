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
 * Archive protection prevents albums with
 * permanent biographical significance from being archived
 * prematurely.
 *
 * A personal classic can currently rest
 * and still remain a classic.
 * That's why this flow first checks
 * permanent significance, not current
 * listening activity.
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
