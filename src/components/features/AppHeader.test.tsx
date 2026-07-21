import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { I18nContext } from "../../i18n/I18nContext"
import { de } from "../../i18n/locales/de"
import AppHeader from "./AppHeader"

function renderHeader(orphanCount = 0, onNavigate = vi.fn()) {
    render(
        <I18nContext.Provider value={{ t: de, language: "de", setLanguage: vi.fn() }}>
            <AppHeader page="home" onNavigate={onNavigate} orphanCount={orphanCount} />
        </I18nContext.Provider>,
    )
    return onNavigate
}

describe("AppHeader navigation", () => {
    it("uses the approved primary navigation order", () => {
        renderHeader()
        expect(screen.getByRole("navigation").querySelectorAll("button")).toHaveLength(6)
        expect(
            Array.from(screen.getByRole("navigation").querySelectorAll("button"), button => button.textContent),
        ).toEqual(["Start", "Bibliothek", "Insights", "Export", "Bindings", "Einstellungen"])
    })

    it("offers the dedicated Insights page", () => {
        const onNavigate = renderHeader()
        fireEvent.click(screen.getByRole("button", { name: "Insights" }))
        expect(onNavigate).toHaveBeenCalledWith("insights")
    })

    it("announces waiting unbound albums without rendering an error banner", () => {
        renderHeader(2)
        const bindings = screen.getByRole("button", { name: /Bindings.*2 ungebundene Alben warten auf dich/ })
        expect(bindings.querySelector(".bindings-attention-dot")).toBeTruthy()
    })

    it("does not decorate Bindings when nothing is waiting", () => {
        renderHeader()
        expect(screen.getByRole("button", { name: "Bindings" }).querySelector(".bindings-attention-dot")).toBeNull()
    })
})
