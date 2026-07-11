import { describe, expect, it } from "vitest"

import { evaluateCoach } from "./evaluateCoach"

describe("evaluateCoach", () => {

    it("starts with heardThreeTimes", () => {

        const result = evaluateCoach({})

        expect(result).toEqual({

            finished: false,

            nextQuestion: "heardThreeTimes",

        })

    })

    describe("Path: new", () => {

        it("finishes with new after heardThreeTimes = false", () => {

            const result = evaluateCoach({

                heardThreeTimes: false,

            })

            expect(result).toEqual({

                finished: true,

                role: "new",

            })

        })

    })

    describe("Path: archive via wouldMissAlbum false", () => {

        it("asks wouldMissAlbum after heardThreeTimes true", () => {

            const result = evaluateCoach({

                heardThreeTimes: true,

            })

            expect(result).toEqual({

                finished: false,

                nextQuestion: "wouldMissAlbum",

            })

        })

        it("finishes with archive after wouldMissAlbum false", () => {

            const result = evaluateCoach({

                heardThreeTimes: true,

                wouldMissAlbum: false,

            })

            expect(result).toEqual({

                finished: true,

                role: "archive",

            })

        })

    })

    describe("Active branch: classic", () => {

        it("asks stillReturningConsciously after wouldMissAlbum true", () => {

            const result = evaluateCoach({

                heardThreeTimes: true,

                wouldMissAlbum: true,

            })

            expect(result).toEqual({

                finished: false,

                nextQuestion: "stillReturningConsciously",

            })

        })

        it("asks shapedTasteLongterm when returning consciously", () => {

            const result = evaluateCoach({

                heardThreeTimes: true,

                wouldMissAlbum: true,

                stillReturningConsciously: true,

            })

            expect(result).toEqual({

                finished: false,

                nextQuestion: "shapedTasteLongterm",

            })

        })

        it("finishes with classic when shapedTasteLongterm true", () => {

            const result = evaluateCoach({

                heardThreeTimes: true,

                wouldMissAlbum: true,

                stillReturningConsciously: true,

                shapedTasteLongterm: true,

            })

            expect(result).toEqual({

                finished: true,

                role: "classic",

            })

        })

    })

    describe("Active branch: comfort-food", () => {

        it("asks comfortAlbum when shapedTasteLongterm false", () => {

            const result = evaluateCoach({

                heardThreeTimes: true,

                wouldMissAlbum: true,

                stillReturningConsciously: true,

                shapedTasteLongterm: false,

            })

            expect(result).toEqual({

                finished: false,

                nextQuestion: "comfortAlbum",

            })

        })

        it("finishes with comfort-food when comfortAlbum true", () => {

            const result = evaluateCoach({

                heardThreeTimes: true,

                wouldMissAlbum: true,

                stillReturningConsciously: true,

                shapedTasteLongterm: false,

                comfortAlbum: true,

            })

            expect(result).toEqual({

                finished: true,

                role: "comfort-food",

            })

        })

    })

    describe("Active branch: growing", () => {

        it("asks surprisedOnLastListen when comfortAlbum false", () => {

            const result = evaluateCoach({

                heardThreeTimes: true,

                wouldMissAlbum: true,

                stillReturningConsciously: true,

                shapedTasteLongterm: false,

                comfortAlbum: false,

            })

            expect(result).toEqual({

                finished: false,

                nextQuestion: "surprisedOnLastListen",

            })

        })

        it("finishes with growing when surprisedOnLastListen true", () => {

            const result = evaluateCoach({

                heardThreeTimes: true,

                wouldMissAlbum: true,

                stillReturningConsciously: true,

                shapedTasteLongterm: false,

                comfortAlbum: false,

                surprisedOnLastListen: true,

            })

            expect(result).toEqual({

                finished: true,

                role: "growing",

            })

        })

    })

    describe("Active branch: admire (fallback)", () => {

        it("finishes with admire when active but not shaped, comfortable, or surprising", () => {

            const result = evaluateCoach({

                heardThreeTimes: true,

                wouldMissAlbum: true,

                stillReturningConsciously: true,

                shapedTasteLongterm: false,

                comfortAlbum: false,

                surprisedOnLastListen: false,

            })

            expect(result).toEqual({

                finished: true,

                role: "admire",

            })

        })

    })

    describe("Resting branch: admire", () => {

        it("asks musicallyValued when not returning consciously", () => {

            const result = evaluateCoach({

                heardThreeTimes: true,

                wouldMissAlbum: true,

                stillReturningConsciously: false,

            })

            expect(result).toEqual({

                finished: false,

                nextQuestion: "musicallyValued",

            })

        })

        it("finishes with admire when musicallyValued true", () => {

            const result = evaluateCoach({

                heardThreeTimes: true,

                wouldMissAlbum: true,

                stillReturningConsciously: false,

                musicallyValued: true,

            })

            expect(result).toEqual({

                finished: true,

                role: "admire",

            })

        })

    })

    describe("Resting branch: archive", () => {

        it("asks memoryOfEarlierPhase when musicallyValued false", () => {

            const result = evaluateCoach({

                heardThreeTimes: true,

                wouldMissAlbum: true,

                stillReturningConsciously: false,

                musicallyValued: false,

            })

            expect(result).toEqual({

                finished: false,

                nextQuestion: "memoryOfEarlierPhase",

            })

        })

        it("finishes with archive when memoryOfEarlierPhase true", () => {

            const result = evaluateCoach({

                heardThreeTimes: true,

                wouldMissAlbum: true,

                stillReturningConsciously: false,

                musicallyValued: false,

                memoryOfEarlierPhase: true,

            })

            expect(result).toEqual({

                finished: true,

                role: "archive",

            })

        })

        it("finishes with archive when resting, not valued, not a memory", () => {

            const result = evaluateCoach({

                heardThreeTimes: true,

                wouldMissAlbum: true,

                stillReturningConsciously: false,

                musicallyValued: false,

                memoryOfEarlierPhase: false,

            })

            expect(result).toEqual({

                finished: true,

                role: "archive",

            })

        })

    })

})
