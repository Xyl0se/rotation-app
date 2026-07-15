import { act, render, screen } from "@testing-library/react"
import { useState } from "react"
import { describe, expect, it, vi } from "vitest"
import type { Album } from "../../../types/album"
import { I18nContext } from "../../../i18n/I18nContext"
import { en } from "../../../i18n/locales/en"
import DiscoverAlbumDialog from "./DiscoverAlbumDialog"

function emptyAlbum(): Album {
    return {
        id: "762afc5e-5408-4d9d-b48a-237874d7ec34",
        title: "",
        artist: "",
        year: "",
        roleHistory: [],
        listenCount: 0,
        lastListened: null,
    }
}

function CaptureHarness({ renderVersion }: { renderVersion: number }) {
    const [album, setAlbum] = useState(emptyAlbum)
    return (
        <I18nContext.Provider value={{ t: en, language: "en", setLanguage: () => {} }}>
            <span data-testid="render-version">{renderVersion}</span>
            <span data-testid="captured-album">
                {album.title}|{album.artist}
            </span>
            <DiscoverAlbumDialog
                open
                album={album}
                setAlbum={setAlbum}
                onClose={() => {}}
                onFinish={vi.fn()}
                prefill={{ title: "Detected Album", artist: "Detected Artist" }}
            />
        </I18nContext.Provider>
    )
}

describe("DiscoverAlbumDialog capture prefill", () => {
    it("stays open when its parent recreates an equivalent prefill object", async () => {
        const view = render(<CaptureHarness renderVersion={1} />)
        await act(async () => {})

        expect(screen.getByTestId("captured-album").textContent).toBe(
            "Detected Album|Detected Artist",
        )

        view.rerender(<CaptureHarness renderVersion={2} />)
        await act(async () => {})

        expect(screen.getByTestId("render-version").textContent).toBe("2")
        expect(screen.getByTestId("captured-album").textContent).toBe(
            "Detected Album|Detected Artist",
        )
    })
})
