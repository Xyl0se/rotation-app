import { describe, expect, it } from "vitest"

import { determineRole } from "./determineRole"

describe("determineRole", () => {

    describe("Pfad: new", () => {

        it("returned new when heardThreeTimes is false", () => {

            const result = determineRole({

                heardThreeTimes: false,

            })

            expect(result).toBe("new")

        })

    })

    describe("Pfad: archive (wouldMissAlbum false)", () => {

        it("returned archive when wouldMissAlbum is false", () => {

            const result = determineRole({

                heardThreeTimes: true,

                wouldMissAlbum: false,

            })

            expect(result).toBe("archive")

        })

    })

    describe("Aktiver Zweig: stillReturningConsciously === true", () => {

        it("returned classic when shapedTasteLongterm is true (Vorrang)", () => {

            const result = determineRole({

                heardThreeTimes: true,

                wouldMissAlbum: true,

                stillReturningConsciously: true,

                shapedTasteLongterm: true,

            })

            expect(result).toBe("classic")

        })

        it("returned classic even when comfortAlbum is also true", () => {

            const result = determineRole({

                heardThreeTimes: true,

                wouldMissAlbum: true,

                stillReturningConsciously: true,

                shapedTasteLongterm: true,

                comfortAlbum: true,

            })

            expect(result).toBe("classic")

        })

        it("returned classic even when surprisedOnLastListen is also true", () => {

            const result = determineRole({

                heardThreeTimes: true,

                wouldMissAlbum: true,

                stillReturningConsciously: true,

                shapedTasteLongterm: true,

                surprisedOnLastListen: true,

            })

            expect(result).toBe("classic")

        })

        it("returned comfort-food when shapedTasteLongterm is false and comfortAlbum is true", () => {

            const result = determineRole({

                heardThreeTimes: true,

                wouldMissAlbum: true,

                stillReturningConsciously: true,

                shapedTasteLongterm: false,

                comfortAlbum: true,

            })

            expect(result).toBe("comfort-food")

        })

        it("returned growing when shapedTasteLongterm false, comfortAlbum false, surprisedOnLastListen true", () => {

            const result = determineRole({

                heardThreeTimes: true,

                wouldMissAlbum: true,

                stillReturningConsciously: true,

                shapedTasteLongterm: false,

                comfortAlbum: false,

                surprisedOnLastListen: true,

            })

            expect(result).toBe("growing")

        })

        it("returned admire when active but neither shaped, comfortable, nor surprising", () => {

            const result = determineRole({

                heardThreeTimes: true,

                wouldMissAlbum: true,

                stillReturningConsciously: true,

                shapedTasteLongterm: false,

                comfortAlbum: false,

                surprisedOnLastListen: false,

            })

            expect(result).toBe("admire")

        })

    })

    describe("Ruhender Zweig: stillReturningConsciously === false", () => {

        it("returned admire when musicallyValued is true", () => {

            const result = determineRole({

                heardThreeTimes: true,

                wouldMissAlbum: true,

                stillReturningConsciously: false,

                musicallyValued: true,

            })

            expect(result).toBe("admire")

        })

        it("returned archive when musicallyValued false and memoryOfEarlierPhase true", () => {

            const result = determineRole({

                heardThreeTimes: true,

                wouldMissAlbum: true,

                stillReturningConsciously: false,

                musicallyValued: false,

                memoryOfEarlierPhase: true,

            })

            expect(result).toBe("archive")

        })

        it("returned archive when resting, not valued, and not a memory (fallback)", () => {

            const result = determineRole({

                heardThreeTimes: true,

                wouldMissAlbum: true,

                stillReturningConsciously: false,

                musicallyValued: false,

                memoryOfEarlierPhase: false,

            })

            expect(result).toBe("archive")

        })

    })

    describe("Überschneidungen und Randfälle", () => {

        it("classic + no general recommendation still stays classic", () => {

            const result = determineRole({

                heardThreeTimes: true,

                wouldMissAlbum: true,

                stillReturningConsciously: true,

                shapedTasteLongterm: true,

            })

            expect(result).toBe("classic")

        })

    })

})
