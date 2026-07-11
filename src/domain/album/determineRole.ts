import type { RoleId } from "../roles"

export interface AlbumCoachAnswerValues {

    heardThreeTimes: boolean

    wouldMissAlbum: boolean

    stillReturningConsciously: boolean

    shapedTasteLongterm: boolean

    comfortAlbum: boolean

    surprisedOnLastListen: boolean

    musicallyValued: boolean

    memoryOfEarlierPhase: boolean

}

export type AlbumCoachAnswers = Partial<AlbumCoachAnswerValues>

/**
 * Ermittelt die aktuelle Rolle eines Albums.
 *
 * Die Reihenfolge bildet bewusst den Album Coach ab.
 * Gleiche Antworten führen immer zur gleichen Rolle.
 *
 * Classic besitzt im aktiven Zweig Vorrang vor
 * comfort-food und growing.
 */
export function determineRole(
    answers: AlbumCoachAnswers
): RoleId {

    if (answers.heardThreeTimes === false) {

        return "new"

    }

    if (answers.wouldMissAlbum === false) {

        return "archive"

    }

    if (answers.stillReturningConsciously === true) {

        // Aktive Beziehung
        if (answers.shapedTasteLongterm === true) {

            return "classic"

        }

        if (answers.comfortAlbum === true) {

            return "comfort-food"

        }

        if (answers.surprisedOnLastListen === true) {

            return "growing"

        }

        // Fallback: active, but neither formative nor familiar nor surprising
        return "admire"

    }

    if (answers.stillReturningConsciously === false) {

        // Ruhende Beziehung
        if (answers.musicallyValued === true) {

            return "admire"

        }

        // memoryOfEarlierPhase === true oder false → archive
        return "archive"

    }

    throw new Error(
        "Incomplete answers for determineRole"
    )

}
