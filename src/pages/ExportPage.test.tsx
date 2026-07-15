import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { I18nContext } from "../i18n/I18nContext"
import { en } from "../i18n/locales/en"
import ExportPage from "./ExportPage"

const mocks = vi.hoisted(() => ({
    reset: vi.fn(),
    resetAndStartOver: vi.fn(),
    checkStartupRecovery: vi.fn(),
}))

vi.mock("../hooks/useExport.js", () => ({
    useExport: () => ({
        state: {
            step: "error",
            preview: null,
            progress: null,
            applyResult: null,
            error: "Preview failed: source folder is unavailable",
            warning: null,
        },
        preview: vi.fn(),
        runStage: vi.fn(),
        runApply: vi.fn(),
        retry: vi.fn(),
        reset: mocks.reset,
        checkStartupRecovery: mocks.checkStartupRecovery,
        retryFromStep: vi.fn(),
        resetAndStartOver: mocks.resetAndStartOver,
    }),
}))

describe("ExportPage preview errors", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        const values = new Map<string, string>()
        vi.stubGlobal("localStorage", {
            getItem: (key: string) => values.get(key) ?? null,
            setItem: (key: string, value: string) => values.set(key, value),
            removeItem: (key: string) => values.delete(key),
            clear: () => values.clear(),
            key: (index: number) => [...values.keys()][index] ?? null,
            get length() { return values.size },
        })
        mocks.checkStartupRecovery.mockResolvedValue(null)
    })

    it("shows a preview request failure and offers recovery actions", () => {
        render(
            <I18nContext.Provider value={{ t: en, language: "en", setLanguage: () => {} }}>
                <ExportPage />
            </I18nContext.Provider>,
        )

        expect(screen.getByRole("alert").textContent).toContain(
            "Preview failed: source folder is unavailable",
        )

        fireEvent.click(screen.getByRole("button", { name: "Cancel" }))
        expect(mocks.reset).toHaveBeenCalledOnce()

        fireEvent.click(screen.getByRole("button", { name: "Reset and start over" }))
        expect(mocks.resetAndStartOver).toHaveBeenCalledOnce()
    })
})
