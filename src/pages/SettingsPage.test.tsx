import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { I18nProvider } from "../i18n/I18nProvider"
import { fetchRotationSettings } from "../services/api/rotationStateService"
import { fetchAuditEvents, fetchUndoPreview, undoLastAuditEvent } from "../services/api/auditService"
import SettingsPage from "./SettingsPage"

vi.mock("../services/api/rotationStateService",()=>({fetchRotationSettings:vi.fn(),saveRotationSettings:vi.fn()}))
vi.mock("../services/api/auditService",()=>({fetchAuditEvents:vi.fn(),fetchUndoPreview:vi.fn(),undoLastAuditEvent:vi.fn()}))

describe("SettingsPage safe undo",()=>{
    beforeEach(()=>{
        vi.clearAllMocks()
        vi.stubGlobal("localStorage",{getItem:vi.fn(()=>"de"),setItem:vi.fn()})
        vi.mocked(fetchRotationSettings).mockResolvedValue({targetSize:1,roleQuotas:[{role:"new",targetCount:1}]})
        const event={id:"event",eventType:"album-role-changed" as const,entityId:"album",before:{title:"Alpha",category:"new"},after:{title:"Alpha",category:"classic"},createdAt:"2026-07-16T10:00:00Z",undoneAt:null}
        vi.mocked(fetchAuditEvents).mockResolvedValue({events:[event]})
        vi.mocked(fetchUndoPreview).mockResolvedValue(event)
        vi.mocked(undoLastAuditEvent).mockResolvedValue({...event,undoneAt:"2026-07-16T11:00:00Z"})
    })
    it("previews the inverse and requires explicit confirmation",async()=>{
        render(<I18nProvider><SettingsPage/></I18nProvider>)
        expect(await screen.findByText("Alpha wird auf die Rolle „Neu entdeckt“ zurückgesetzt.")).toBeTruthy()
        fireEvent.click(screen.getByRole("button",{name:"Letzte Rollenänderung rückgängig"}))
        expect(screen.getByRole("dialog",{name:"Diese Rolle wiederherstellen?"})).toBeTruthy()
        expect(undoLastAuditEvent).not.toHaveBeenCalled()
        fireEvent.click(screen.getByRole("button",{name:"Wiederherstellung bestätigen"}))
        await waitFor(()=>expect(undoLastAuditEvent).toHaveBeenCalledOnce())
    })
    it("does not offer Undo when the server reports no safe inverse",async()=>{
        vi.mocked(fetchAuditEvents).mockResolvedValue({events:[]})
        vi.mocked(fetchUndoPreview).mockRejectedValue(new Error("NOTHING_TO_UNDO"))
        render(<I18nProvider><SettingsPage/></I18nProvider>)
        const button=await screen.findByRole("button",{name:"Letzte Rollenänderung rückgängig"})
        expect((button as HTMLButtonElement).disabled).toBe(true)
        expect(screen.queryByRole("dialog")).toBeNull()
    })
})
