import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { I18nProvider } from "../i18n/I18nProvider"
import { fetchRotationSettings, saveRotationSettings } from "../services/api/rotationStateService"
import SettingsPage from "./SettingsPage"

vi.mock("../services/api/rotationStateService", () => ({
    fetchRotationSettings: vi.fn(),
    saveRotationSettings: vi.fn(),
}))

const defaults = { targetSize: 25, roleQuotas: [
    { role: "new" as const, targetCount: 10 }, { role: "comfort-food" as const, targetCount: 5 },
    { role: "classic" as const, targetCount: 5 }, { role: "growing" as const, targetCount: 5 },
] }

describe("SettingsPage", () => {
    beforeEach(() => {
        vi.stubGlobal("localStorage", {
            getItem: vi.fn(() => "en"),
            setItem: vi.fn(),
        })
        vi.clearAllMocks()
        vi.mocked(fetchRotationSettings).mockResolvedValue(defaults)
        vi.mocked(saveRotationSettings).mockImplementation(async settings => settings)
    })

    it("loads the server-owned defaults and saves a changed maximum", async () => {
        render(<I18nProvider><SettingsPage /></I18nProvider>)
        const maximum = await screen.findByLabelText("Maximum Albums")
        expect((maximum as HTMLInputElement).value).toBe("25")
        fireEvent.change(maximum, { target: { value: "20" } })
        fireEvent.click(screen.getByRole("button", { name: "Save settings" }))
        await waitFor(() => expect(saveRotationSettings).toHaveBeenCalledWith(expect.objectContaining({ targetSize: 20 })))
    })

    it("keeps the warning transparent when quota sum and maximum differ", async () => {
        render(<I18nProvider><SettingsPage /></I18nProvider>)
        await screen.findByLabelText("Maximum Albums")
        fireEvent.change(screen.getByLabelText("Maximum Albums"), { target: { value: "20" } })
        expect(screen.getByText("Role quota sum: 25 · Maximum: 20").classList.contains("settings-sum--warning")).toBe(true)
    })
})
