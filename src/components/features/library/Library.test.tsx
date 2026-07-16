import { fireEvent, render, screen, within } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { I18nContext } from "../../../i18n/I18nContext"
import { de } from "../../../i18n/locales/de"
import type { Album } from "../../../types/album"
import Library from "./Library"

vi.mock("../../../hooks/useBindings.js", () => ({
    useBindings: () => ({ bindings: [] }),
}))

const albums: Album[] = [
    {
        id: "11111111-1111-4111-8111-111111111111", title: "Blue Train", artist: "John Coltrane",
        year: "1957", category: "classic", roleHistory: [], listenCount: 2, lastListened: "2026-01-01",
        story: { memoryNote: "Reise nach Montréal", acquiredBecause: "gift", lifePhase: "travel", createdAt: "2026-01-01", updatedAt: "2026-01-01" },
    },
    {
        id: "22222222-2222-4222-8222-222222222222", title: "Unknown Future", artist: "New Artist",
        year: "2026", roleHistory: [], listenCount: 0, lastListened: null,
    },
]

function renderLibrary(libraryAlbums: Album[] = albums) {
    const noop = () => {}
    return render(
        <I18nContext.Provider value={{ t: de, language: "de", setLanguage: noop }}>
            <Library albums={libraryAlbums} focusAlbumId={null} onArchive={noop} onDelete={noop}
                onEdit={noop} onLogListen={noop} onReconsider={noop} onSetFocus={noop}
                onStartCoach={noop} />
        </I18nContext.Provider>,
    )
}

describe("Library findability", () => {
    beforeEach(() => vi.clearAllMocks())

    it("searches Album Story and focuses search with the slash shortcut", () => {
        renderLibrary()
        const search = screen.getByRole("searchbox", { name: "Suche" })
        fireEvent.keyDown(document, { key: "/" })
        expect(document.activeElement).toBe(search)
        fireEvent.change(search, { target: { value: "montreal" } })
        expect(screen.getByText("Blue Train")).toBeTruthy()
        expect(screen.queryByText("Unknown Future")).toBeNull()
        expect(screen.getByText("1 von 2 Alben")).toBeTruthy()
    })

    it("isolates roleless albums and resets all controls", () => {
        renderLibrary()
        fireEvent.change(screen.getByRole("combobox", { name: "Rolle" }), { target: { value: "none" } })
        expect(screen.getByText("Unknown Future")).toBeTruthy()
        expect(screen.queryByText("Blue Train")).toBeNull()
        fireEvent.click(screen.getByRole("button", { name: "Filter zurücksetzen" }))
        expect(screen.getByText("Blue Train")).toBeTruthy()
        expect(screen.getByText("Unknown Future")).toBeTruthy()
    })

    it("keeps the filtered projection when switching perspectives", () => {
        renderLibrary()
        fireEvent.change(screen.getByRole("searchbox", { name: "Suche" }), { target: { value: "Blue Train" } })
        fireEvent.click(screen.getByRole("button", { name: "Perspektiven" }))
        fireEvent.click(screen.getByRole("button", { name: "Jahr" }))
        expect(screen.getByText("Blue Train")).toBeTruthy()
        expect(screen.queryByText("Unknown Future")).toBeNull()
    })

    it("offers transparent toggleable quick views", () => {
        renderLibrary()
        const controls = screen.getByRole("region", { name: "Bibliothek durchsuchen und filtern" })
        const quick = within(controls).getByRole("button", { name: "Noch nie gehört" })
        expect(quick.getAttribute("aria-pressed")).toBe("false")
        fireEvent.click(quick)
        expect(quick.getAttribute("aria-pressed")).toBe("true")
        expect(screen.getByText("Alben ohne dokumentierte Hörsession und mit Höranzahl 0.")).toBeTruthy()
        expect(screen.getByText("Unknown Future")).toBeTruthy()
        expect(screen.queryByText("Blue Train")).toBeNull()
    })

    it("shows a useful empty state with reset", () => {
        renderLibrary()
        fireEvent.change(screen.getByRole("searchbox", { name: "Suche" }), { target: { value: "does not exist" } })
        expect(screen.getByRole("status").textContent).toContain("Keine Alben entsprechen")
        fireEvent.click(within(screen.getByRole("status")).getByRole("button", { name: "Filter zurücksetzen" }))
        expect(screen.getByText("2 von 2 Alben")).toBeTruthy()
    })

    it("shows newest albums first and paginates after ten entries", () => {
        const manyAlbums = Array.from({ length: 12 }, (_, index): Album => ({
            id: `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
            title: `Album ${index + 1}`,
            artist: "Artist",
            year: "2026",
            roleHistory: [],
            listenCount: 0,
            lastListened: null,
            createdAt: `2026-01-${String(index + 1).padStart(2, "0")}T12:00:00.000Z`,
        }))

        renderLibrary(manyAlbums)
        expect(screen.getByText("Album 12")).toBeTruthy()
        expect(screen.queryByText("Album 1")).toBeNull()
        expect(screen.getByText("Seite 1 von 2")).toBeTruthy()

        fireEvent.click(screen.getByRole("button", { name: "Weiter" }))
        expect(screen.getByText("Album 1")).toBeTruthy()
        expect(screen.queryByText("Album 12")).toBeNull()
    })
})
