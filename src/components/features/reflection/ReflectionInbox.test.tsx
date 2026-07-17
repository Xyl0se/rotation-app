import { fireEvent,render,screen } from "@testing-library/react"
import { beforeEach,describe,expect,it,vi } from "vitest"
import { I18nProvider } from "../../../i18n/I18nProvider"
import ReflectionInbox from "./ReflectionInbox"
import type { ReflectionInboxItem } from "../../../services/api/reflectionService"

const item:ReflectionInboxItem={id:"item",albumId:"album",albumTitle:"Blue Train",albumArtist:"John Coltrane",ruleCode:"new-after-listens",state:"open",evidence:{role:"new",listenCount:3,lastListened:"2026-01-01T00:00:00.000Z",roleSince:"2025-01-01T00:00:00.000Z",daysInRole:200,daysSinceListen:100,recentRotationCount:0},createdAt:"2026-01-01T00:00:00.000Z",dueAt:"2026-01-01T00:00:00.000Z",snoozedUntil:null,resolvedAt:null,resolution:null}
const renderInbox=(props:Partial<Parameters<typeof ReflectionInbox>[0]>={})=>render(<I18nProvider><ReflectionInbox items={[item]} isLoading={false} error={null} onRetry={vi.fn()} onReflect={vi.fn()} onSnooze={vi.fn()} onDismiss={vi.fn()} {...props}/></I18nProvider>)

describe("ReflectionInbox",()=>{
    beforeEach(()=>vi.stubGlobal("localStorage",{getItem:vi.fn(()=>"de"),setItem:vi.fn()}))
    it("explains evidence and exposes all calm actions",()=>{
        const onReflect=vi.fn(),onSnooze=vi.fn(),onDismiss=vi.fn();renderInbox({onReflect,onSnooze,onDismiss})
        expect(screen.getByText("Blue Train")).toBeTruthy();expect(screen.getByText("3 Hörsessions · 200 Tage in dieser Rolle")).toBeTruthy()
        fireEvent.click(screen.getByRole("button",{name:"Neu einordnen"}));expect(onReflect).toHaveBeenCalledWith(item)
        fireEvent.click(screen.getByRole("button",{name:"Später · 30 Tage"}));expect(onSnooze).toHaveBeenCalledWith("item",30)
        fireEvent.click(screen.getByRole("button",{name:"90 Tage ruhen lassen"}));expect(onSnooze).toHaveBeenCalledWith("item",90)
        fireEvent.click(screen.getByRole("button",{name:"Für diesen Anlass nicht mehr fragen"}));expect(onDismiss).toHaveBeenCalledWith("item")
    })
    it("renders loading, unavailable, retry and empty states",()=>{
        const retry=vi.fn();const view=renderInbox({items:[],isLoading:true});expect(screen.getByRole("status")).toBeTruthy()
        view.rerender(<I18nProvider><ReflectionInbox items={[]} isLoading={false} error="offline" onRetry={retry} onReflect={vi.fn()} onSnooze={vi.fn()} onDismiss={vi.fn()}/></I18nProvider>)
        fireEvent.click(screen.getByRole("button",{name:"Erneut versuchen"}));expect(retry).toHaveBeenCalled()
        view.rerender(<I18nProvider><ReflectionInbox items={[]} isLoading={false} error={null} onRetry={retry} onReflect={vi.fn()} onSnooze={vi.fn()} onDismiss={vi.fn()}/></I18nProvider>)
        expect(screen.getByText("Gerade keine offene Frage")).toBeTruthy()
    })
    it("renders English copy",()=>{
        vi.stubGlobal("localStorage",{getItem:vi.fn(()=>"en"),setItem:vi.fn()});renderInbox()
        expect(screen.getByRole("button",{name:"Later · 30 days"})).toBeTruthy();expect(screen.getByText("3 listens · 200 days in this role")).toBeTruthy()
    })
})
