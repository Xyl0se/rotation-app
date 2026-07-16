import { describe, expect, it } from "vitest"
import { determineRole } from "./determineRole"

describe("determineRole", () => {
    it.each([
        [{ heardThreeTimes: false }, "new"],
        [{ heardThreeTimes: true, stillReturningConsciously: false, shapedTasteLongterm: true }, "classic"],
        [{ heardThreeTimes: true, stillReturningConsciously: false, shapedTasteLongterm: false, musicallyValued: true }, "admire"],
        [{ heardThreeTimes: true, stillReturningConsciously: false, shapedTasteLongterm: false, musicallyValued: false }, "archive"],
        [{ heardThreeTimes: true, stillReturningConsciously: true, shapedTasteLongterm: true, comfortAlbum: false }, "classic"],
        [{ heardThreeTimes: true, stillReturningConsciously: true, shapedTasteLongterm: false, comfortAlbum: true }, "comfort-food"],
        [{ heardThreeTimes: true, stillReturningConsciously: true, shapedTasteLongterm: false, comfortAlbum: false, surprisedOnLastListen: true }, "growing"],
        [{ heardThreeTimes: true, stillReturningConsciously: true, shapedTasteLongterm: false, comfortAlbum: false, surprisedOnLastListen: false, musicallyValued: true }, "admire"],
        [{ heardThreeTimes: true, stillReturningConsciously: true, shapedTasteLongterm: false, comfortAlbum: false, surprisedOnLastListen: false, musicallyValued: false }, "archive"],
    ] as const)("maps a complete answer path to %s", (answers, expected) => {
        expect(determineRole(answers)).toBe(expected)
    })

    it("uses an explicit differentiator when classic and comfort overlap", () => {
        const overlap = {
            heardThreeTimes: true,
            stillReturningConsciously: true,
            shapedTasteLongterm: true,
            comfortAlbum: true,
        }
        expect(determineRole({ ...overlap, comfortDefinesRelationshipToday: true })).toBe("comfort-food")
        expect(determineRole({ ...overlap, comfortDefinesRelationshipToday: false })).toBe("classic")
        expect(() => determineRole(overlap)).toThrow("Incomplete answers")
    })
})
