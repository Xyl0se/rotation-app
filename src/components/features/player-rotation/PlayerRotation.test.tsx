import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { I18nProvider } from "../../../i18n/I18nProvider"
import { fetchRotationHandover } from "../../../services/api/rotationStateService"
import PlayerRotation from "./PlayerRotation"

vi.mock("../../../services/api/rotationStateService", () => ({
    fetchRotationHandover: vi.fn(),
}))

const album = {
    id: "album-a",
    title: "Alpha",
    artist: "Artist",
    year: "2026",
    category: "new" as const,
    roleHistory: [],
    listenCount: 0,
    lastListened: null,
}

const draft = {
    id: "draft",
    name: "Draft",
    targetSize: 2,
    items: [{ albumId: album.id, role: "new" as const, reason: "quota" as const }],
    albumIds: [album.id],
    roleQuotas: [{ role: "new" as const, targetCount: 2 }],
    createdAt: "2026-07-16T10:00:00.000Z",
    status: "draft" as const,
}

describe("PlayerRotation handover", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.stubGlobal("localStorage", { getItem: vi.fn(() => "de"), setItem: vi.fn() })
        vi.mocked(fetchRotationHandover).mockResolvedValue({
            draftId: "draft",
            activeId: "active",
            entering: [album.id],
            leaving: ["album-b"],
            unchanged: [],
            beforeRoles: { new: 0, classic: 1 },
            afterRoles: { new: 1, classic: 0 },
            quotaGaps: { new: 1 },
            size: 1,
            targetSize: 2,
            missingBindings: [album.id],
            unconfirmedBindings: [],
            estimatedSizeBytes: 1024,
            fileCount: 3,
            exportReady: false,
        })
    })

    it("shows changes, quotas, export readiness and accepts only after confirmation", async () => {
        const onAccept = vi.fn()
        render(<I18nProvider><PlayerRotation albums={[album]} plan={draft} listenEvents={[]} onGenerate={vi.fn()} onAccept={onAccept} /></I18nProvider>)

        fireEvent.click(screen.getByRole("button", { name: "Mitnehmen" }))
        expect(await screen.findByRole("dialog", { name: "Rotation wechseln?" })).toBeTruthy()
        expect(screen.getByText("1 kommen hinzu · 1 verlassen die Rotation · 0 bleiben")).toBeTruthy()
        expect(screen.getByText(/Neu entdeckt: 0 → 1 · 1 unter der Quote/)).toBeTruthy()
        expect(screen.getByText("Geschätzter Export: 1.0 KB · 3 Dateien")).toBeTruthy()
        expect(screen.getByText("1 fehlende und 0 unbestätigte Bindings")).toBeTruthy()
        expect(onAccept).not.toHaveBeenCalled()

        fireEvent.click(screen.getByRole("button", { name: "Bestätigen und mitnehmen" }))
        expect(onAccept).toHaveBeenCalledOnce()
    })

    it("keeps acceptance closed when the server preview cannot be loaded", async () => {
        vi.mocked(fetchRotationHandover).mockRejectedValue(new Error("Preview unavailable"))
        render(<I18nProvider><PlayerRotation albums={[album]} plan={draft} listenEvents={[]} onGenerate={vi.fn()} onAccept={vi.fn()} /></I18nProvider>)

        fireEvent.click(screen.getByRole("button", { name: "Mitnehmen" }))
        await waitFor(() => expect(screen.getByRole("alert").textContent).toBe("Preview unavailable"))
        expect(screen.queryByRole("dialog")).toBeNull()
    })

    it("renders the handover evidence in English", async () => {
        vi.stubGlobal("localStorage", { getItem: vi.fn(() => "en"), setItem: vi.fn() })
        render(<I18nProvider><PlayerRotation albums={[album]} plan={draft} listenEvents={[]} onGenerate={vi.fn()} onAccept={vi.fn()} /></I18nProvider>)
        fireEvent.click(screen.getByRole("button", { name: "Take With Me" }))
        expect(await screen.findByText("1 entering · 1 leaving · 0 unchanged")).toBeTruthy()
        expect(screen.getByText("1 missing and 0 unconfirmed Bindings")).toBeTruthy()
    })
})
