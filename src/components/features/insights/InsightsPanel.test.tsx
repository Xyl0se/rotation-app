import { fireEvent,render,screen } from "@testing-library/react"
import type { ReactNode } from "react"
import { describe,expect,it,vi } from "vitest"
import { I18nContext } from "../../../i18n/I18nContext"
import { en } from "../../../i18n/locales/en"
import { de } from "../../../i18n/locales/de"
import InsightsPanel from "./InsightsPanel"
import type { InsightsResponse } from "../../../services/api/insightsService"

const data:InsightsResponse={generatedAt:"2026-07-18T12:00:00.000Z",roleOverview:{new:2,growing:0,"comfort-food":1,classic:0,admire:0,archive:0,unassigned:0},buildingAreas:[],insights:[{code:"rediscovery-moments",family:"rediscovery",evidenceLevel:"supported",period:{from:"2026-04-19T12:00:00.000Z",to:"2026-07-18T12:00:00.000Z"},evidence:[{metric:"rediscovered-listens",value:3}]}]}
const WithI18n=({children}:{children:ReactNode})=><I18nContext.Provider value={{t:en,language:"en",setLanguage:()=>{}}}>{children}</I18nContext.Provider>
const WithGerman=({children}:{children:ReactNode})=><I18nContext.Provider value={{t:de,language:"de",setLanguage:()=>{}}}>{children}</I18nContext.Provider>
describe("InsightsPanel",()=>{
    it("shows deterministic copy and discloses supporting evidence",()=>{
        render(<WithI18n><InsightsPanel data={data} isLoading={false} error={null} onRetry={vi.fn()}/></WithI18n>)
        expect(screen.getByRole("heading",{name:"Something long quiet has returned"})).toBeTruthy()
        fireEvent.click(screen.getByText("Why am I seeing this?"));expect(screen.getByText("3 listens returned after at least 180 days")).toBeTruthy();expect(screen.getByText("rediscovery-moments")).toBeTruthy()
    })
    it("renders an honest sparse-data state and retryable errors",()=>{
        const retry=vi.fn(),building={...data,insights:[],buildingAreas:["listening-comparison" as const]}
        const view=render(<WithI18n><InsightsPanel data={building} isLoading={false} error={null} onRetry={retry}/></WithI18n>)
        expect(screen.getByRole("heading",{name:"A listening comparison is growing"})).toBeTruthy()
        view.rerender(<WithI18n><InsightsPanel data={null} isLoading={false} error="offline" onRetry={retry}/></WithI18n>);fireEvent.click(screen.getByRole("button",{name:"Try again"}));expect(retry).toHaveBeenCalledOnce()
    })
    it("localizes structured personal-history subjects without interpreting prose",()=>{
        const personal:InsightsResponse={...data,insights:[{code:"life-phase-return",family:"personal-history",evidenceLevel:"supported",subject:{kind:"life-phase",value:"school"},evidence:[{metric:"personal-theme-listens",value:4}]}]}
        render(<WithGerman><InsightsPanel data={personal} isLoading={false} error={null} onRetry={vi.fn()}/></WithGerman>)
        expect(screen.getByRole("heading",{name:"Musik aus der Lebensphase Schulzeit ist wieder da"})).toBeTruthy()
        expect(screen.queryByText(/memoryNote|Journal/)).toBeNull()
    })
})
