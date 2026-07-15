import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import OfflineIndicator from "./OfflineIndicator"
import { ConnectionContext } from "../../contexts/connectionState"
import { I18nContext } from "../../i18n/I18nContext"
import { en } from "../../i18n/locales/en"
import type { ConnectionState } from "../../contexts/connectionState"

function renderIndicator(state: Partial<ConnectionState>) {
    const value: ConnectionState = {
        isOnline: true,
        apiReachable: true,
        isRetrying: false,
        retryCount: 0,
        lastError: null,
        lastApiCheckAt: null,
        ...state,
    }
    return render(
        <I18nContext.Provider value={{ t: en, language: "en", setLanguage: () => {} }}>
            <ConnectionContext.Provider value={value}>
                <OfflineIndicator />
            </ConnectionContext.Provider>
        </I18nContext.Provider>,
    )
}

describe("OfflineIndicator", () => {
    it("shows cache mode when only the API is unavailable", () => {
        renderIndicator({ apiReachable: false })
        expect(screen.getByText(/Server unavailable|Server nicht erreichbar/)).toBeTruthy()
    })

    it("shows browser offline state separately", () => {
        renderIndicator({ isOnline: false, apiReachable: false })
        expect(screen.getByText(/Offline/)).toBeTruthy()
    })

    it("shows concurrent retry activity", () => {
        renderIndicator({ isRetrying: true, retryCount: 2 })
        expect(screen.getByText(/Retrying|Wiederhole/)).toBeTruthy()
    })

    it("renders nothing when browser and API are healthy", () => {
        const { container } = renderIndicator({})
        expect(container.innerHTML).toBe("")
    })
})
