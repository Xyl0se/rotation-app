import { describe, expect, it } from "vitest"
import { albumDetailPath, albumIdFromPath } from "./albumDetailRoute"

describe("Album Detail route", () => {
    it("round-trips an Album ID safely", () => {
        const path = albumDetailPath("album/id with spaces")
        expect(path).toBe("/albums/album%2Fid%20with%20spaces")
        expect(albumIdFromPath(path)).toBe("album/id with spaces")
    })

    it("ignores unrelated and malformed paths", () => {
        expect(albumIdFromPath("/settings")).toBeNull()
        expect(albumIdFromPath("/albums/%E0%A4%A")).toBeNull()
    })
})
