import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import AlbumProgress from "../AlbumProgress.js"

function makeManifest() {
    return {
        albumId: "album-1",
        title: "Test Album",
        artist: "Test Artist",
        coverPath: null,
        totalDuration: 600,
        tracks: [
            {
                opaqueTrackId: "t1",
                discNumber: 1,
                trackNumber: 1,
                title: "Track One",
                duration: 180,
                mediaType: "mp3" as const,
                playable: true,
                _sourcePath: "/music/t1.mp3",
            },
            {
                opaqueTrackId: "t2",
                discNumber: 1,
                trackNumber: 2,
                title: "Track Two",
                duration: 200,
                mediaType: "mp3" as const,
                playable: true,
                _sourcePath: "/music/t2.mp3",
            },
            {
                opaqueTrackId: "t3",
                discNumber: 1,
                trackNumber: 3,
                title: "Track Three",
                duration: 220,
                mediaType: "mp3" as const,
                playable: true,
                _sourcePath: "/music/t3.mp3",
            },
        ],
        orderingDiagnostic: "ok" as const,
    }
}

describe("AlbumProgress", () => {
    it("renders a semantic progressbar", () => {
        render(
            <AlbumProgress
                manifest={makeManifest()}
                currentTrackIndex={0}
                currentTime={30}
                trackDuration={180}
                albumProgress={0.05}
            />
        )

        const progressbar = screen.getByRole("progressbar")
        expect(progressbar).toBeTruthy()
        expect(progressbar.getAttribute("aria-valuenow")).toBe("5")
        expect(progressbar.getAttribute("aria-valuemin")).toBe("0")
        expect(progressbar.getAttribute("aria-valuemax")).toBe("100")
    })

    it("renders track tick markers", () => {
        const { container } = render(
            <AlbumProgress
                manifest={makeManifest()}
                currentTrackIndex={1}
                currentTime={50}
                trackDuration={200}
                albumProgress={0.3833}
            />
        )

        const ticks = container.querySelectorAll(".album-progress__tick")
        expect(ticks.length).toBe(3)
    })

    it("highlights the current track tick", () => {
        const { container } = render(
            <AlbumProgress
                manifest={makeManifest()}
                currentTrackIndex={1}
                currentTime={50}
                trackDuration={200}
                albumProgress={0.3833}
            />
        )

        const currentTick = container.querySelector(".album-progress__tick--current")
        expect(currentTick).not.toBeNull()
    })

    it("displays elapsed and total time", () => {
        render(
            <AlbumProgress
                manifest={makeManifest()}
                currentTrackIndex={1}
                currentTime={50}
                trackDuration={200}
                albumProgress={0.3833}
            />
        )

        expect(screen.getByText("3:50")).toBeTruthy() // elapsed
        expect(screen.getByText("10:00")).toBeTruthy() // total
    })

    it("has no clickable or draggable elements", () => {
        const { container } = render(
            <AlbumProgress
                manifest={makeManifest()}
                currentTrackIndex={0}
                currentTime={0}
                trackDuration={180}
                albumProgress={0}
            />
        )

        const clickable = container.querySelectorAll("button, a, [role='slider'], input")
        expect(clickable.length).toBe(0)
    })

    it("handles zero total duration gracefully", () => {
        const manifest = makeManifest()
        manifest.totalDuration = 0
        manifest.tracks = manifest.tracks.map((t) => ({ ...t, duration: 0 }))

        render(
            <AlbumProgress
                manifest={manifest}
                currentTrackIndex={0}
                currentTime={0}
                trackDuration={null}
                albumProgress={0}
            />
        )

        expect(screen.getByRole("progressbar")).toBeTruthy()
        const times = screen.getAllByText("0:00")
        expect(times.length).toBe(2) // elapsed and total
    })

    it("marks disc boundaries distinctly", () => {
        const manifest = makeManifest()
        manifest.tracks[0].discNumber = 1
        manifest.tracks[1].discNumber = 2
        manifest.tracks[2].discNumber = 2

        const { container } = render(
            <AlbumProgress
                manifest={manifest}
                currentTrackIndex={0}
                currentTime={0}
                trackDuration={180}
                albumProgress={0}
            />
        )

        const discTicks = container.querySelectorAll(".album-progress__tick--disc")
        expect(discTicks.length).toBeGreaterThanOrEqual(1)
    })
})
