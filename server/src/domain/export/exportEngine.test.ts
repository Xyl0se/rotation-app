import { describe, it, expect } from "vitest"
import { previewExport, type SizeCalculator } from "./exportEngine.js"
import type { PathGuard } from "../../infrastructure/filesystem/pathGuard.js"
import type { BindingRecord } from "../../infrastructure/persistence/sqlite/bindingRepository.js"

function mockGuard(root: string): PathGuard {
    return (relative: string) => `${root}/${relative}`
}

const mockSizeCalculator: SizeCalculator = (_dir) => ({ sizeBytes: 100_000, fileCount: 10 })

function makeBinding(overrides: Partial<BindingRecord> = {}): BindingRecord {
    return {
        album_id: "Pink Floyd/The Dark Side of the Moon",
        relative_path: "Pink Floyd/The Dark Side of the Moon",
        state: "confirmed",
        match_source: "scan-exact",
        proposed_at: "2026-01-01T00:00:00Z",
        confirmed_at: "2026-01-02T00:00:00Z",
        library_album_id: null,
        ...overrides,
    }
}

describe("previewExport", () => {
    it("returns empty preview when no album IDs given", () => {
        const result = previewExport("exp-1", [], new Map(), mockGuard("/music"), mockSizeCalculator)

        expect(result.albumCount).toBe(0)
        expect(result.canExport).toBe(false)
        expect(result.missingBindings).toEqual([])
        expect(result.unconfirmedBindings).toEqual([])
    })

    it("marks missing bindings when album has no binding", () => {
        const result = previewExport("exp-1", ["Unknown/Album"], new Map(), mockGuard("/music"), mockSizeCalculator)

        expect(result.missingBindings).toEqual(["Unknown/Album"])
        expect(result.canExport).toBe(false)
    })

    it("marks unconfirmed bindings", () => {
        const binding = makeBinding({ state: "proposed" })
        const map = new Map([[binding.album_id, binding]])

        const result = previewExport("exp-1", [binding.album_id], map, mockGuard("/music"), mockSizeCalculator)

        expect(result.unconfirmedBindings).toEqual([binding.album_id])
        expect(result.canExport).toBe(false)
    })

    it("resolves confirmed binding to source", () => {
        const binding = makeBinding()
        const map = new Map([[binding.album_id, binding]])

        const result = previewExport("exp-1", [binding.album_id], map, mockGuard("/music"), mockSizeCalculator)

        expect(result.albumCount).toBe(1)
        expect(result.sources[0].albumId).toBe(binding.album_id)
        expect(result.sources[0].absolutePath).toBe("/music/Pink Floyd/The Dark Side of the Moon")
        expect(result.sources[0].artistName).toBe("Pink Floyd")
        expect(result.sources[0].albumName).toBe("The Dark Side of the Moon")
        expect(result.missingBindings).toEqual([])
        expect(result.unconfirmedBindings).toEqual([])
        expect(result.canExport).toBe(true)
    })

    it("handles flat paths for artist/album extraction", () => {
        const binding = makeBinding({
            album_id: "Soundtrack",
            relative_path: "Soundtrack",
        })
        const map = new Map([[binding.album_id, binding]])

        const result = previewExport("exp-1", [binding.album_id], map, mockGuard("/music"), mockSizeCalculator)

        expect(result.sources[0].artistName).toBe("")
        expect(result.sources[0].albumName).toBe("Soundtrack")
    })

    it("aggregates size and file count across multiple albums", () => {
        const b1 = makeBinding({ album_id: "A/One", relative_path: "A/One" })
        const b2 = makeBinding({ album_id: "B/Two", relative_path: "B/Two" })
        const map = new Map([
            [b1.album_id, b1],
            [b2.album_id, b2],
        ])

        const result = previewExport("exp-1", [b1.album_id, b2.album_id], map, mockGuard("/music"), mockSizeCalculator)

        expect(result.totalSizeBytes).toBe(200_000)
        expect(result.fileCount).toBe(20)

        expect(result.albumCount).toBe(2)
        expect(result.canExport).toBe(true)
    })

    it("reports mixed issues: missing + unconfirmed", () => {
        const confirmed = makeBinding({ album_id: "C/Confirmed" })
        const proposed = makeBinding({ album_id: "D/Proposed", state: "proposed" })
        const map = new Map([
            [confirmed.album_id, confirmed],
            [proposed.album_id, proposed],
        ])

        const result = previewExport("exp-1", [confirmed.album_id, proposed.album_id, "E/Missing"], map, mockGuard("/music"), mockSizeCalculator)

        expect(result.albumCount).toBe(1)
        expect(result.missingBindings).toEqual(["E/Missing"])
        expect(result.unconfirmedBindings).toEqual(["D/Proposed"])
        expect(result.canExport).toBe(false)
    })
})
