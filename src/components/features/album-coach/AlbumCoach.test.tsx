import {fireEvent,render,screen} from "@testing-library/react"
import {describe,expect,it,vi} from "vitest"
import {I18nContext} from "../../../i18n/I18nContext"
import {de} from "../../../i18n/locales/de"
import {en} from "../../../i18n/locales/en"
import AlbumCoach from "./AlbumCoach"

const renderCoach=(onComplete=vi.fn())=>{render(<I18nContext.Provider value={{t:de,language:"de",setLanguage:()=>{}}}><AlbumCoach albumTitle="Testalbum" album={{id:"test-album"}} onComplete={onComplete}/></I18nContext.Provider>);return onComplete}
describe("AlbumCoach three-stage journey",()=>{
    it("moves from Intro through one Snapshot page to an explainable Result",()=>{
        const onComplete=renderCoach();fireEvent.click(screen.getByRole("button",{name:"Los geht's"}))
        expect(screen.getByText("Schritt 2 von 3 · Momentaufnahme")).toBeTruthy()
        fireEvent.click(screen.getByLabelText("Bis zu dreimal"));fireEvent.click(screen.getByLabelText("Ja"));fireEvent.click(screen.getByRole("button",{name:"Empfehlung anzeigen"}))
        expect(screen.getByText("Schritt 3 von 3 · Empfehlung")).toBeTruthy();expect(screen.getByText(/noch nicht vollständig/)).toBeTruthy()
        fireEvent.click(screen.getByRole("button",{name:"Rolle bestätigen"}));expect(onComplete).toHaveBeenCalledWith("new",undefined)
    })
    it("requires and returns a granular reason when Archive is chosen manually",()=>{
        const onComplete=renderCoach();fireEvent.click(screen.getByRole("button",{name:"Los geht's"}));fireEvent.click(screen.getByLabelText("Noch gar nicht"));fireEvent.click(screen.getByLabelText("Ja"));fireEvent.click(screen.getByRole("button",{name:"Empfehlung anzeigen"}))
        fireEvent.click(screen.getByRole("button",{name:"📦 Archiv"}));expect(screen.getByRole("button",{name:"Rolle bestätigen"}).hasAttribute("disabled")).toBe(true)
        fireEvent.click(screen.getByLabelText(/Bedeutend, aber nicht meines/));fireEvent.click(screen.getByRole("button",{name:"Rolle bestätigen"}))
        expect(onComplete).toHaveBeenCalledWith("archive","canonical-but-not-personal")
    })
    it("renders the same semantic Snapshot in English",()=>{
        render(<I18nContext.Provider value={{t:en,language:"en",setLanguage:()=>{}}}><AlbumCoach albumTitle="Test album" album={{id:"test"}} onComplete={vi.fn()}/></I18nContext.Provider>);fireEvent.click(screen.getByRole("button",{name:"Let's go"}));expect(screen.getByText("Step 2 of 3 · Relationship snapshot")).toBeTruthy();expect(screen.getByLabelText("More than three times")).toBeTruthy()
    })
})
