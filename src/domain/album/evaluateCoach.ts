/**
 * The Album Coach is the heart of Rotation.
 *
 * This file describes the complete
 * decision tree with which Rotation together
 * with the user determines the current role of an album.
 *
 * Changes to this file deliberately change
 * the philosophy of the product.
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
 * Decides based on the answers given so far,
 * which question must be asked next
 * or whether a role can already be clearly determined.
 *
 * Only the questions required for the respective
 * branch are asked.
 */
export function evaluateCoach(
    answers: AlbumCoachAnswers
): CoachEvaluation {

    // Question 1
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

    // Question 2
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

    // Question 3: Active or resting relationship?
    if (answers.stillReturningConsciously === undefined) {

        return {

            finished: false,

            nextQuestion: "stillReturningConsciously",

        }

    }

    if (answers.stillReturningConsciously === true) {

        // Active branch
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

        // Fallback: active, but neither formative nor familiar nor surprising
        return {

            finished: true,

            role: "admire",

        }

    }

    if (answers.stillReturningConsciously === false) {

        // Resting branch
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

        // memoryOfEarlierPhase === true or false → archive
        return {

            finished: true,

            role: "archive",

        }

    }

    throw new Error(
        "Incomplete answers for evaluateCoach"
    )

}
