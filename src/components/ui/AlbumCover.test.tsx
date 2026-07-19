import { render, screen, waitFor } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import AlbumCover from "./AlbumCover"
import { fetchCoverUrl } from "../../services/api/coversService"
import { cacheCover, getCachedCover, getCustomCover } from "../../repositories/coverCache"

vi.mock("../../services/api/coversService", () => ({
    fetchCoverUrl: vi.fn(),
}))
vi.mock("../../repositories/coverCache", () => ({
    cacheCover: vi.fn(),
    getCachedCover: vi.fn(),
    getCustomCover: vi.fn(),
}))

describe("AlbumCover", () => {
    afterEach(() => {
        vi.clearAllMocks()
        vi.unstubAllGlobals()
    })

    it("uses only the same-origin cached cover for a persisted album", async () => {
        vi.mocked(fetchCoverUrl).mockResolvedValue("blob:same-origin-cover")
        const providerFetch = vi.fn()
        vi.stubGlobal("fetch", providerFetch)

        render(<AlbumCover
            albumId="550e8400-e29b-41d4-a716-446655440000"
            coverUrl="https://coverartarchive.org/release/private/front"
            title="Album"
            alt="Album cover"
        />)

        await waitFor(() => expect(screen.getByRole("img", { name: "Album cover" }).getAttribute("src"))
            .toBe("blob:same-origin-cover"))
        expect(fetchCoverUrl).toHaveBeenCalledWith("550e8400-e29b-41d4-a716-446655440000")
        expect(providerFetch).not.toHaveBeenCalled()
        expect(getCustomCover).not.toHaveBeenCalled()
        expect(getCachedCover).not.toHaveBeenCalled()
        expect(cacheCover).not.toHaveBeenCalled()
    })

    it("shows a placeholder instead of falling back to a provider for a cache miss", async () => {
        vi.mocked(fetchCoverUrl).mockResolvedValue(null)
        const providerFetch = vi.fn()
        vi.stubGlobal("fetch", providerFetch)

        render(<AlbumCover
            albumId="550e8400-e29b-41d4-a716-446655440000"
            coverUrl="https://coverartarchive.org/release/private/front"
            title="Album"
            alt="Album cover"
        />)

        await waitFor(() => expect(screen.getByLabelText("Album cover")).toBeTruthy())
        expect(screen.queryByRole("img")).toBeNull()
        expect(providerFetch).not.toHaveBeenCalled()
        expect(getCachedCover).not.toHaveBeenCalled()
        expect(cacheCover).not.toHaveBeenCalled()
    })
})
