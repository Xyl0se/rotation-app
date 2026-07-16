import type { RoleId } from "../roles"

export interface AlbumCoachAnswerValues {
    heardThreeTimes: boolean
    stillReturningConsciously: boolean
    shapedTasteLongterm: boolean
    comfortAlbum: boolean
    comfortDefinesRelationshipToday: boolean
    surprisedOnLastListen: boolean
    musicallyValued: boolean
}

export type AlbumCoachAnswers = Partial<AlbumCoachAnswerValues>

/**
 * Determines the role from a complete path through the Album Coach.
 * Classic, Comfort Food, and Admiration describe independent qualities:
 * biography, familiar return, and musical esteem.
 */
export function determineRole(answers: AlbumCoachAnswers): RoleId {
    if (answers.heardThreeTimes === false) return "new"

    if (answers.stillReturningConsciously === false) {
        if (answers.shapedTasteLongterm === true) return "classic"
        if (answers.musicallyValued === true) return "admire"
        return "archive"
    }

    if (answers.stillReturningConsciously === true) {
        const shaped = answers.shapedTasteLongterm === true
        const comforting = answers.comfortAlbum === true

        if (shaped && comforting) {
            if (answers.comfortDefinesRelationshipToday === true) return "comfort-food"
            if (answers.comfortDefinesRelationshipToday === false) return "classic"
            throw new Error("Incomplete answers for determineRole")
        }
        if (shaped) return "classic"
        if (comforting) return "comfort-food"
        if (answers.surprisedOnLastListen === true) return "growing"
        if (answers.musicallyValued === true) return "admire"
        if (answers.musicallyValued === false) return "archive"
    }

    throw new Error("Incomplete answers for determineRole")
}
