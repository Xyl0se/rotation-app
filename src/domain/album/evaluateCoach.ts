import type { RoleId } from "../roles"
import type { AlbumCoachAnswers } from "./determineRole"

export type CoachQuestionId = keyof AlbumCoachAnswers

export type CoachEvaluation =
    | { finished: false; nextQuestion: CoachQuestionId }
    | { finished: true; role: RoleId }

export function evaluateCoach(answers: AlbumCoachAnswers): CoachEvaluation {
    if (answers.heardThreeTimes === undefined) {
        return { finished: false, nextQuestion: "heardThreeTimes" }
    }
    if (!answers.heardThreeTimes) {
        if (answers.wantsToGiveChance === undefined) {
            return { finished: false, nextQuestion: "wantsToGiveChance" }
        }
        return { finished: true, role: answers.wantsToGiveChance ? "new" : "archive" }
    }

    if (answers.stillReturningConsciously === undefined) {
        return { finished: false, nextQuestion: "stillReturningConsciously" }
    }

    if (answers.shapedTasteLongterm === undefined) {
        return { finished: false, nextQuestion: "shapedTasteLongterm" }
    }

    if (!answers.stillReturningConsciously) {
        if (answers.shapedTasteLongterm) return { finished: true, role: "classic" }
        if (answers.musicallyValued === undefined) {
            return { finished: false, nextQuestion: "musicallyValued" }
        }
        return { finished: true, role: answers.musicallyValued ? "admire" : "archive" }
    }

    if (answers.comfortAlbum === undefined) {
        return { finished: false, nextQuestion: "comfortAlbum" }
    }

    if (answers.shapedTasteLongterm && answers.comfortAlbum) {
        if (answers.comfortDefinesRelationshipToday === undefined) {
            return { finished: false, nextQuestion: "comfortDefinesRelationshipToday" }
        }
        return {
            finished: true,
            role: answers.comfortDefinesRelationshipToday ? "comfort-food" : "classic",
        }
    }

    if (answers.shapedTasteLongterm) return { finished: true, role: "classic" }
    if (answers.comfortAlbum) return { finished: true, role: "comfort-food" }

    if (answers.surprisedOnLastListen === undefined) {
        return { finished: false, nextQuestion: "surprisedOnLastListen" }
    }
    if (answers.surprisedOnLastListen) return { finished: true, role: "growing" }

    if (answers.musicallyValued === undefined) {
        return { finished: false, nextQuestion: "musicallyValued" }
    }
    return { finished: true, role: answers.musicallyValued ? "admire" : "archive" }
}
