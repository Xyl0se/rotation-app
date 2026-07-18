import { fireEvent,render,screen } from "@testing-library/react"
import { describe,expect,it,vi } from "vitest"
import { I18nContext } from "../../../i18n/I18nContext"
import { en } from "../../../i18n/locales/en"
import ListeningJournalEditor from "./ListeningJournalEditor"

const event={id:"event",albumId:"album",listenedAt:"2026-07-18T10:00:00.000Z"}
const album={id:"album",title:"Blue Train",artist:"John Coltrane",year:"1957",roleHistory:[],listenCount:1,lastListened:event.listenedAt}
const Wrapper=({children}:{children:React.ReactNode})=><I18nContext.Provider value={{t:en,language:"en",setLanguage:()=>{}}}>{children}</I18nContext.Provider>
describe("ListeningJournalEditor",()=>{
    it("keeps typed text visible after a failed save",async()=>{
        const save=vi.fn().mockResolvedValue(false)
        render(<Wrapper><ListeningJournalEditor event={event} album={album} onClose={vi.fn()} onSave={save} onDelete={vi.fn()}/></Wrapper>)
        const field=screen.getByPlaceholderText("A sound, a feeling, a moment…");fireEvent.change(field,{target:{value:"Private memory"}});fireEvent.click(screen.getByRole("button",{name:"Save thought"}))
        expect(await screen.findByRole("alert")).toBeTruthy();expect((field as HTMLTextAreaElement).value).toBe("Private memory")
    })
    it("offers deletion only for an existing journal",()=>{
        render(<Wrapper><ListeningJournalEditor event={{...event,journal:{note:"Old",moodTags:[],contextTags:[],createdAt:event.listenedAt,updatedAt:event.listenedAt}}} album={album} onClose={vi.fn()} onSave={vi.fn()} onDelete={vi.fn()}/></Wrapper>)
        expect(screen.getByRole("button",{name:"Remove note"})).toBeTruthy()
    })
    it("can be dismissed without saving",()=>{
        const close=vi.fn();render(<Wrapper><ListeningJournalEditor event={event} album={album} onClose={close} onSave={vi.fn()} onDelete={vi.fn()}/></Wrapper>);fireEvent.keyDown(document,{key:"Escape"});expect(close).toHaveBeenCalledOnce()
    })
})
