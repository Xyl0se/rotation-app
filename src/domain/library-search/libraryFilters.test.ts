import { describe, expect, it } from "vitest"
import type { Album } from "../../types/album"
import { emptyLibraryFilters, filterLibraryAlbums, hasActiveLibraryFilters } from "./libraryFilters"

function album(overrides: Partial<Album> = {}): Album {
    return {
        id: crypto.randomUUID(), title: "Blue Train", artist: "John Coltrane", year: "1957",
        roleHistory: [], listenCount: 0, lastListened: null, ...overrides,
    }
}

describe("filterLibraryAlbums", () => {
    it("searches title, artist, and story without case or diacritic sensitivity", () => {
        const albums = [album({ story: {
            acquiredBecause: "gift", lifePhase: "travel", memoryNote: "Café in Montréal",
            createdAt: "2026-01-01", updatedAt: "2026-01-01",
        } })]
        for (const query of ["BLUE TRAIN", "coltrane", "cafe in montreal", "travel"]) {
            expect(filterLibraryAlbums(albums, { ...emptyLibraryFilters, query })).toHaveLength(1)
        }
    })

    it("combines role, archive, inclusive year, and listening filters", () => {
        const target = album({ category: "classic", year: "1957", listenCount: 0 })
        const other = album({ category: "comfort-food", year: "1970", listenCount: 2 })
        expect(filterLibraryAlbums([target, other], {
            ...emptyLibraryFilters, role: "classic", archive: "active",
            yearFrom: "1950", yearTo: "1960", listening: "never",
        })).toEqual([target])
    })

    it("isolates albums without a role", () => {
        const roleless = album()
        const apiRoleless = { ...album(), category: null } as unknown as Album
        expect(filterLibraryAlbums([roleless, apiRoleless, album({ category: "new" })], {
            ...emptyLibraryFilters, role: "none",
        })).toEqual([roleless, apiRoleless])
    })

    it("counts listening events even before mirrored album fields update", () => {
        const target = album()
        expect(filterLibraryAlbums([target], { ...emptyLibraryFilters, listening: "never" }, [{
            id: "event", albumId: target.id, listenedAt: "2026-01-01",
        }])).toEqual([])
    })

    it("defines recently archived as an archive assignment within 30 days", () => {
        const recent = album({ category: "archive", roleHistory: [{
            role: "archive", source: "archive", recordedAt: "2026-07-01T00:00:00Z",
        }] })
        const old = album({ category: "archive", roleHistory: [{
            role: "archive", source: "archive", recordedAt: "2026-05-01T00:00:00Z",
        }] })
        expect(filterLibraryAlbums([recent, old], {
            ...emptyLibraryFilters, quickView: "recently-archived",
        }, [], new Date("2026-07-16T00:00:00Z"))).toEqual([recent])
    })

    it("handles a representative 10,000 album projection", () => {
        const albums = Array.from({ length: 10_000 }, (_, index) => album({
            id: `album-${index}`, title: `Album ${index}`, artist: `Artist ${index % 100}`,
        }))
        const started = performance.now()
        expect(filterLibraryAlbums(albums, { ...emptyLibraryFilters, query: "album 9999" })).toHaveLength(1)
        expect(performance.now() - started).toBeLessThan(500)
    })

    it("detects whether controls differ from their reset state", () => {
        expect(hasActiveLibraryFilters(emptyLibraryFilters)).toBe(false)
        expect(hasActiveLibraryFilters({ ...emptyLibraryFilters, role: "none" })).toBe(true)
    })
})
