import type { CoachQuestionId } from "./evaluateCoach"

/** Keeps translation lookup exhaustive when coach questions change. */
export const coachQuestionIds: Record<CoachQuestionId, CoachQuestionId> = {
    heardThreeTimes: "heardThreeTimes",
    stillReturningConsciously: "stillReturningConsciously",
    shapedTasteLongterm: "shapedTasteLongterm",
    comfortAlbum: "comfortAlbum",
    comfortDefinesRelationshipToday: "comfortDefinesRelationshipToday",
    surprisedOnLastListen: "surprisedOnLastListen",
    musicallyValued: "musicallyValued",
}
