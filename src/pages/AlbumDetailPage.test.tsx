import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { I18nContext } from "../i18n/I18nContext"
import { de } from "../i18n/locales/de"
import { AlbumSessionProvider } from "../contexts/AlbumSessionProvider.tsx"
import type { Album } from "../types/album"
import AlbumDetailPage from "./AlbumDetailPage"

const album: Album = {
    id: "album-1",
    title: "Detailalbum",
    artist: "Künstlerin",
    year: "2024",
    category: "growing",
    listenCount: 1,
    lastListened: "2026-01-03T00:00:00.000Z",
    roleHistory: [{ role: "growing", recordedAt: "2026-01-02T00:00:00.000Z", source: "coach" }],
    story: { acquiredBecause: "completion", lifePhase: "current", memoryNote: "Eine lange Erinnerung.", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
}

const defaults = {
    albumId: album.id,
    album,
    listenEvents: [{ id: "listen-1", albumId: album.id, listenedAt: "2026-01-03T00:00:00.000Z" }],
    reflections: [],
    currentRotation: null,
    historicRotations: [],
    isLoading: false,
    partialErrors: [],
    onBack: vi.fn(),
    onEdit: vi.fn(),
    onLogListen: vi.fn(),
    onSaveSources: vi.fn(async () => true),
}

const renderPage = (overrides: Partial<Parameters<typeof AlbumDetailPage>[0]> = {}) => render(
    <I18nContext.Provider value={{ t: de, language: "de", setLanguage: vi.fn() }}>
        <AlbumSessionProvider>
            <AlbumDetailPage {...defaults} {...overrides} />
        </AlbumSessionProvider>
    </I18nContext.Provider>,
)

describe("AlbumDetailPage", () => {
    it("composes complete canonical Album data", () => {
        renderPage({ binding: { albumId: "folder-1", libraryAlbumId: album.id, relativePath: "Künstlerin/Detailalbum", state: "confirmed", matchSource: "manual", proposedAt: null, confirmedAt: "2026-01-01T00:00:00.000Z", folderExists: true, libraryExists: true } })
        expect(screen.getByRole("heading", { name: "Detailalbum" })).toBeTruthy()
        expect(screen.getByText("Komplettierung")).toBeTruthy()
        expect(screen.getByText("Eine lange Erinnerung.")).toBeTruthy()
        expect(screen.getByText("Künstlerin/Detailalbum")).toBeTruthy()
        expect(screen.getByText("1 dokumentierte Session")).toBeTruthy()
    })

    it("keeps empty related sections useful", () => {
        renderPage({ album: { ...album, story: undefined, roleHistory: [] }, listenEvents: [] })
        expect(screen.getByText("Für dieses Album ist noch keine persönliche Geschichte festgehalten.")).toBeTruthy()
        expect(screen.getByText("Für dieses Album ist noch keine Hörsession dokumentiert.")).toBeTruthy()
        expect(screen.getByText("Für dieses Album ist kein Musikordner-Binding bestätigt.")).toBeTruthy()
    })

    it("shows partial-data and unavailable Album states", () => {
        const view = renderPage({ partialErrors: ["offline"] })
        expect(screen.getByText("Einige zugehörige Informationen sind nicht verfügbar.")).toBeTruthy()
        view.rerender(<I18nContext.Provider value={{ t: de, language: "de", setLanguage: vi.fn() }}><AlbumDetailPage {...defaults} album={undefined} /></I18nContext.Provider>)
        expect(screen.getByRole("alert").textContent).toContain("Album nicht gefunden")
    })
})
