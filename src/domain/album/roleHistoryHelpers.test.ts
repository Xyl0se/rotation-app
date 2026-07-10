import { describe, expect, it } from "vitest"
import { makeAlbum } from "../__tests__/factory"
import {
    getCurrentRoleHistoryEntry,
    getFirstRoleHistoryEntry,
    getRoleSince,
} from "./roleHistoryHelpers"

describe("roleHistoryHelpers", () => {
    describe("getCurrentRoleHistoryEntry", () => {
        it("returns undefined when no history", () => {
            const album = makeAlbum({ roleHistory: [] })
            expect(getCurrentRoleHistoryEntry(album)).toBeUndefined()
        })

        it("returns the last entry", () => {
            const album = makeAlbum({
                roleHistory: [
                    { role: "new", recordedAt: "2024-01-01", source: "coach" },
                    { role: "growing", recordedAt: "2024-02-01", source: "reflection" },
                ],
            })
            expect(getCurrentRoleHistoryEntry(album)).toEqual({
                role: "growing",
                recordedAt: "2024-02-01",
                source: "reflection",
            })
        })
    })

    describe("getFirstRoleHistoryEntry", () => {
        it("returns undefined when no history", () => {
            const album = makeAlbum({ roleHistory: [] })
            expect(getFirstRoleHistoryEntry(album)).toBeUndefined()
        })

        it("returns the first entry", () => {
            const album = makeAlbum({
                roleHistory: [
                    { role: "new", recordedAt: "2024-01-01", source: "coach" },
                    { role: "growing", recordedAt: "2024-02-01", source: "reflection" },
                ],
            })
            expect(getFirstRoleHistoryEntry(album)).toEqual({
                role: "new",
                recordedAt: "2024-01-01",
                source: "coach",
            })
        })
    })

    describe("getRoleSince", () => {
        it("returns undefined when no history", () => {
            const album = makeAlbum({ roleHistory: [] })
            expect(getRoleSince(album)).toBeUndefined()
        })

        it("returns recordedAt of the last entry", () => {
            const album = makeAlbum({
                roleHistory: [
                    { role: "new", recordedAt: "2024-01-01", source: "coach" },
                    { role: "growing", recordedAt: "2024-06-15", source: "reflection" },
                ],
            })
            expect(getRoleSince(album)).toBe("2024-06-15")
        })
    })
})
