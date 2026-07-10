import { describe, expect, it } from "vitest"

import { evaluateArchiveProtection } from "./evaluateArchiveProtection"

describe("evaluateArchiveProtection", () => {

    it("starts with hasBiographicPlace", () => {

        const result = evaluateArchiveProtection({})

        expect(result).toEqual({

            finished: false,

            nextQuestion: "hasBiographicPlace",

        })

    })

    it("returns classic when album has biographic place", () => {

        const result = evaluateArchiveProtection({

            hasBiographicPlace: true,

        })

        expect(result).toEqual({

            finished: true,

            role: "classic",

        })

    })

    it("asks stillReturningConsciously when no biographic place", () => {

        const result = evaluateArchiveProtection({

            hasBiographicPlace: false,

        })

        expect(result).toEqual({

            finished: false,

            nextQuestion: "stillReturningConsciously",

        })

    })

    it("returns admire when actively returning", () => {

        const result = evaluateArchiveProtection({

            hasBiographicPlace: false,

            stillReturningConsciously: true,

        })

        expect(result).toEqual({

            finished: true,

            role: "admire",

        })

    })

    it("asks musicallyValued when not actively returning", () => {

        const result = evaluateArchiveProtection({

            hasBiographicPlace: false,

            stillReturningConsciously: false,

        })

        expect(result).toEqual({

            finished: false,

            nextQuestion: "musicallyValued",

        })

    })

    it("returns admire when musically valued but not active", () => {

        const result = evaluateArchiveProtection({

            hasBiographicPlace: false,

            stillReturningConsciously: false,

            musicallyValued: true,

        })

        expect(result).toEqual({

            finished: true,

            role: "admire",

        })

    })

    it("returns archive when neither biographic, active, nor valued", () => {

        const result = evaluateArchiveProtection({

            hasBiographicPlace: false,

            stillReturningConsciously: false,

            musicallyValued: false,

        })

        expect(result).toEqual({

            finished: true,

            role: "archive",

        })

    })

})
