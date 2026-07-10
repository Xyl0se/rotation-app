import type { RoleId } from "../roles"

export type ArchiveReturnReason =
    | "recommendation"
    | "artist"
    | "curiosity"

export type ArchiveReturnListeningNeed =
    | "familiarity"
    | "discovery"

export interface ArchiveReturnAnswers {

    heardLastSixMonths: boolean

    remembersMoment: boolean

    wouldDefendAlbum: boolean

    reason: ArchiveReturnReason

    fitsCurrentMood: boolean

    listeningNeed: ArchiveReturnListeningNeed

}

export type ArchiveReturnQuestionId =
    keyof ArchiveReturnAnswers

export type ArchiveReturnEvaluation =
    | {
          finished: false
          nextQuestion: ArchiveReturnQuestionId
      }
    | {
          finished: true
          role: RoleId
      }

export function evaluateArchiveReturn(
    answers: Partial<ArchiveReturnAnswers>,
): ArchiveReturnEvaluation {

    if (answers.heardLastSixMonths === undefined) {

        return {
            finished: false,
            nextQuestion: "heardLastSixMonths",
        }

    }

    if (answers.heardLastSixMonths) {

        return {
            finished: true,
            role: "archive",
        }

    }

    if (answers.remembersMoment === undefined) {

        return {
            finished: false,
            nextQuestion: "remembersMoment",
        }

    }

    if (!answers.remembersMoment) {

        return {
            finished: true,
            role: "archive",
        }

    }

    if (answers.wouldDefendAlbum === undefined) {

        return {
            finished: false,
            nextQuestion: "wouldDefendAlbum",
        }

    }

    if (answers.wouldDefendAlbum) {

        return {
            finished: true,
            role: "classic",
        }

    }

    if (answers.reason === undefined) {

        return {
            finished: false,
            nextQuestion: "reason",
        }

    }

    if (answers.fitsCurrentMood === undefined) {

        return {
            finished: false,
            nextQuestion: "fitsCurrentMood",
        }

    }

    if (!answers.fitsCurrentMood) {

        return {
            finished: true,
            role: "archive",
        }

    }

    if (answers.listeningNeed === undefined) {

        return {
            finished: false,
            nextQuestion: "listeningNeed",
        }

    }

    return {

        finished: true,

        role: answers.listeningNeed === "familiarity"
            ? "classic"
            : "growing",

    }

}
