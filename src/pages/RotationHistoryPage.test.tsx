import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { I18nProvider } from "../i18n/I18nProvider"
import { createDraftFromHistory, fetchRotationHistory } from "../services/api/rotationStateService"
import RotationHistoryPage from "./RotationHistoryPage"

vi.mock("../services/api/rotationStateService",()=>({fetchRotationHistory:vi.fn(),createDraftFromHistory:vi.fn()}))
describe("RotationHistoryPage",()=>{
    beforeEach(()=>{vi.stubGlobal("localStorage",{getItem:vi.fn(()=>"en"),setItem:vi.fn()});vi.clearAllMocks();vi.mocked(fetchRotationHistory).mockResolvedValue({total:1,limit:10,offset:0,items:[{id:"plan",name:"Summer",targetSize:1,albumIds:["album"],items:[{albumId:"album",role:"new",reason:"quota",albumTitleSnapshot:"Title",albumArtistSnapshot:"Artist"}],roleQuotas:[{role:"new",targetCount:1}],createdAt:"2026-01-01T00:00:00.000Z",archivedAt:"2026-02-01T00:00:00.000Z",status:"archived",focusAlbumId:null,exports:[{id:"export",appliedAt:"2026-01-15T00:00:00.000Z",totalSizeBytes:1024,fileCount:3}]}]});vi.mocked(createDraftFromHistory).mockResolvedValue({} as never)})
    it("shows linked exports and creates a fresh draft from history",async()=>{render(<I18nProvider><RotationHistoryPage/></I18nProvider>);expect(await screen.findByText("Artist — Title")).toBeTruthy();expect(screen.getByText(/3 Files/)).toBeTruthy();fireEvent.click(screen.getByRole("button",{name:"Use as new suggestion"}));await waitFor(()=>expect(createDraftFromHistory).toHaveBeenCalledWith("plan"))})
})
