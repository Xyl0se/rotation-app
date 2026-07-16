import { describe, expect, it } from "vitest"
import { evaluateCoach } from "./evaluateCoach"
import type { AlbumCoachAnswers } from "./determineRole"

function expectRole(answers: AlbumCoachAnswers, role: string) {
    expect(evaluateCoach(answers)).toEqual({ finished: true, role })
}

describe("evaluateCoach", () => {
    it("starts by establishing whether the album is still new", () => {
        expect(evaluateCoach({})).toEqual({ finished: false, nextQuestion: "heardThreeTimes" })
        expect(evaluateCoach({ heardThreeTimes: false })).toEqual({
            finished: false, nextQuestion: "wantsToGiveChance",
        })
        expectRole({ heardThreeTimes: false, wantsToGiveChance: true }, "new")
        expectRole({ heardThreeTimes: false, wantsToGiveChance: false }, "archive")
    })

    it("checks current return and long-term influence before classifying mature albums", () => {
        expect(evaluateCoach({ heardThreeTimes: true })).toEqual({
            finished: false, nextQuestion: "stillReturningConsciously",
        })
        expect(evaluateCoach({ heardThreeTimes: true, stillReturningConsciously: true })).toEqual({
            finished: false, nextQuestion: "shapedTasteLongterm",
        })
    })

    it("recognizes a resting but formative album as classic", () => {
        expectRole({
            heardThreeTimes: true,
            stillReturningConsciously: false,
            shapedTasteLongterm: true,
        }, "classic")
    })

    it("distinguishes admiration from archive in the resting branch", () => {
        const base = {
            heardThreeTimes: true,
            stillReturningConsciously: false,
            shapedTasteLongterm: false,
        }
        expect(evaluateCoach(base)).toEqual({ finished: false, nextQuestion: "musicallyValued" })
        expectRole({ ...base, musicallyValued: true }, "admire")
        expectRole({ ...base, musicallyValued: false }, "archive")
    })

    it("recognizes distinct classic and comfort-food paths", () => {
        const active = { heardThreeTimes: true, stillReturningConsciously: true }
        expectRole({ ...active, shapedTasteLongterm: true, comfortAlbum: false }, "classic")
        expectRole({ ...active, shapedTasteLongterm: false, comfortAlbum: true }, "comfort-food")
    })

    it("asks what defines the relationship when classic and comfort overlap", () => {
        const overlap = {
            heardThreeTimes: true,
            stillReturningConsciously: true,
            shapedTasteLongterm: true,
            comfortAlbum: true,
        }
        expect(evaluateCoach(overlap)).toEqual({
            finished: false, nextQuestion: "comfortDefinesRelationshipToday",
        })
        expectRole({ ...overlap, comfortDefinesRelationshipToday: true }, "comfort-food")
        expectRole({ ...overlap, comfortDefinesRelationshipToday: false }, "classic")
    })

    it("distinguishes growing, admiration, and archive after classic and comfort are excluded", () => {
        const base = {
            heardThreeTimes: true,
            stillReturningConsciously: true,
            shapedTasteLongterm: false,
            comfortAlbum: false,
        }
        expect(evaluateCoach(base)).toEqual({ finished: false, nextQuestion: "surprisedOnLastListen" })
        expectRole({ ...base, surprisedOnLastListen: true }, "growing")
        expect(evaluateCoach({ ...base, surprisedOnLastListen: false })).toEqual({
            finished: false, nextQuestion: "musicallyValued",
        })
        expectRole({ ...base, surprisedOnLastListen: false, musicallyValued: true }, "admire")
        expectRole({ ...base, surprisedOnLastListen: false, musicallyValued: false }, "archive")
    })
})
