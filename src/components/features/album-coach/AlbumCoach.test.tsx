import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { I18nContext } from "../../../i18n/I18nContext"
import { de } from "../../../i18n/locales/de"
import AlbumCoach from "./AlbumCoach"

describe("AlbumCoach i18n and role paths", () => {
    it("renders the complete comfort-food path in German", () => {
        const onComplete = vi.fn()
        render(
            <I18nContext.Provider value={{ t: de, language: "de", setLanguage: () => {} }}>
                <AlbumCoach albumTitle="Testalbum" album={{ id: "test-album" }} onComplete={onComplete} />
            </I18nContext.Provider>,
        )

        fireEvent.click(screen.getByRole("button", { name: "Los geht's" }))
        expect(screen.getByText("Hast du dieses Album mindestens dreimal bewusst gehört?")).toBeTruthy()

        fireEvent.click(screen.getByRole("button", { name: "Ja" }))
        expect(screen.getByText("Kehrst du heute noch bewusst zu diesem Album zurück?")).toBeTruthy()

        fireEvent.click(screen.getByRole("button", { name: "Ja" }))
        expect(screen.getByText(/Hat dieses Album dich über längere Zeit begleitet/)).toBeTruthy()

        fireEvent.click(screen.getByRole("button", { name: "Ja" }))
        expect(screen.getByText(/Greifst du manchmal ganz automatisch/)).toBeTruthy()

        fireEvent.click(screen.getByRole("button", { name: "Ja" }))
        expect(screen.getByText(/Beschreibt die vertraute, mühelose Rückkehr/)).toBeTruthy()

        fireEvent.click(screen.getByRole("button", { name: "Ja" }))
        expect(screen.getByText("Unsere Empfehlung")).toBeTruthy()

        fireEvent.click(screen.getByRole("button", { name: "Rolle übernehmen" }))
        expect(onComplete).toHaveBeenCalledWith("comfort-food")
    })
})
