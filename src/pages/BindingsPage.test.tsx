import { fireEvent, render, screen, waitFor,within } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { I18nContext } from "../i18n/I18nContext"
import { en } from "../i18n/locales/en"
import BindingsPage from "./BindingsPage"

const mocks = vi.hoisted(() => ({
    fetchBindings: vi.fn(),
    triggerScan: vi.fn(),
    getScanProgress: vi.fn(),
    toastSuccess: vi.fn(),
    toastError: vi.fn(),
    captureBinding: vi.fn(),
    updateAlbum: vi.fn(),
    fetchBindingCandidates:vi.fn(),
    fetchAlbums:vi.fn(),
    selectBindingCandidate:vi.fn(),
    deleteBinding:vi.fn(),
}))

vi.mock("../components/features/diagnostics/DiagnosticsPanel.js", () => ({
    default: () => null,
}))

vi.mock("../components/features/discover-album/DiscoverAlbumDialog.js", () => ({
    default: ({ onFinish, album }: { onFinish: (album: unknown) => void; album: unknown }) => (
        <button onClick={() => onFinish(album)}>Finish capture</button>
    ),
}))

vi.mock("../components/features/album-coach/AlbumCoach.js", () => ({
    default: ({ onComplete }: { onComplete: (role: string) => void }) => (
        <button onClick={() => onComplete("new")}>Complete coach</button>
    ),
}))

vi.mock("../services/api/albumsService.js", () => ({
    updateAlbum: mocks.updateAlbum,
    fetchAlbums:mocks.fetchAlbums,
}))

vi.mock("../services/api/bindingsService.js", () => ({
    fetchBindings: mocks.fetchBindings,
    confirmBinding: vi.fn(),
    deleteBinding: mocks.deleteBinding,
    verifyBindings: vi.fn(),
    reconcileBindings: vi.fn(),
    captureBinding: mocks.captureBinding,
    fetchBindingCandidates:mocks.fetchBindingCandidates,
    selectBindingCandidate:mocks.selectBindingCandidate,rejectBindingCandidates:vi.fn(),selectBindingLibraryAlbum:vi.fn(),
}))

vi.mock("../services/api/scanService.js", () => ({
    triggerScan: mocks.triggerScan,
    getScanProgress: mocks.getScanProgress,
}))

vi.mock("../hooks/useToast.js", () => ({
    useToast: () => ({ success: mocks.toastSuccess, error: mocks.toastError }),
}))

describe("BindingsPage manual music scan", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mocks.fetchBindings.mockReset()
        mocks.fetchBindings
            .mockResolvedValueOnce({ bindings: [], count: 0 })
            .mockResolvedValue({
                bindings: [{
                    albumId: "Artist/New Album",
                    relativePath: "Artist/New Album",
                    state: "proposed",
                    matchSource: null,
                    proposedAt: "2026-07-15T00:00:00.000Z",
                    confirmedAt: null,
                    libraryAlbumId: null,
                    folderExists: true,
                    libraryExists: false,
                }],
                count: 1,
            })
        mocks.triggerScan.mockResolvedValue({ scanId: "scan-1", status: "completed" })
        mocks.getScanProgress.mockResolvedValue({
            scanId: "scan-1",
            directoriesScanned: 2,
            directoriesSkipped: 0,
            status: "completed",
        })
        mocks.fetchBindingCandidates.mockResolvedValue({candidates:[]})
        mocks.fetchAlbums.mockResolvedValue([])
    })

    it("triggers a scan and refreshes bindings when it completes", async () => {
        render(
            <I18nContext.Provider value={{ t: en, language: "en", setLanguage: () => {} }}>
                <BindingsPage />
            </I18nContext.Provider>,
        )

        const scanButton = await screen.findByRole("button", { name: "Scan music folder" })
        fireEvent.click(scanButton)

        await waitFor(() => expect(mocks.triggerScan).toHaveBeenCalledOnce())
        await waitFor(() => expect(mocks.getScanProgress).toHaveBeenCalledWith("scan-1"))
        await waitFor(() => expect(mocks.fetchBindings.mock.calls.length).toBeGreaterThanOrEqual(2))
        expect(await screen.findByText("Artist/New Album")).toBeTruthy()
        expect(screen.getByText("Source folder")).toBeTruthy()
        expect(screen.getByText("Resolve →")).toBeTruthy()
        expect(mocks.toastSuccess).toHaveBeenCalledWith(
            "Music scan completed. Bindings have been refreshed.",
        )
    })

    it("uses the atomic server capture operation", async () => {
        mocks.fetchBindings.mockReset()
        mocks.fetchBindings.mockResolvedValue({
            bindings: [{
                albumId: "Artist/New Album",
                relativePath: "Artist/New Album",
                state: "proposed",
                matchSource: null,
                proposedAt: "2026-07-15T00:00:00.000Z",
                confirmedAt: null,
                libraryAlbumId: null,
                folderExists: true,
                libraryExists: false,
                suggestedArtist: "Artist",
                suggestedTitle: "New Album",
            }],
            count: 1,
        })
        mocks.captureBinding.mockImplementation(async (_bindingId: string, album: object) => ({
            album: { ...album, roleHistory: [], listenCount: 0, lastListened: null },
            binding: {},
        }))
        mocks.updateAlbum.mockResolvedValue({})
        render(
            <I18nContext.Provider value={{ t: en, language: "en", setLanguage: () => {} }}>
                <BindingsPage />
            </I18nContext.Provider>,
        )

        fireEvent.click(await screen.findByRole("button", { name: /Artist — New Album/ }))
        fireEvent.click(await screen.findByRole("button", { name: "Create new Library Album" }))
        fireEvent.click(await screen.findByRole("button", { name: "Finish capture" }))

        await waitFor(() => expect(mocks.captureBinding).toHaveBeenCalledOnce())
        expect(mocks.captureBinding).toHaveBeenCalledWith(
            "Artist/New Album",
            expect.objectContaining({ id: expect.any(String) }),
        )
        fireEvent.click(await screen.findByRole("button", { name: "Complete coach" }))
        await waitFor(() => expect(mocks.updateAlbum).toHaveBeenCalledWith(
            expect.objectContaining({ category: "new" }),
        ))
    })

    it("shows unresolved cards by default and resolves an existing Library candidate from the card",async()=>{
        mocks.fetchBindings.mockReset();mocks.fetchBindings.mockResolvedValue({bindings:[
            {albumId:"Artist/Loose",relativePath:"Artist/Loose",state:"proposed",matchSource:null,proposedAt:null,confirmedAt:null,libraryAlbumId:null,folderExists:true,libraryExists:false,suggestedArtist:"Artist",suggestedTitle:"Loose"},
            {albumId:"Artist/Done",relativePath:"Artist/Done",state:"confirmed",matchSource:"manual",proposedAt:null,confirmedAt:"2026-01-01",libraryAlbumId:"library-done",folderExists:true,libraryExists:true,albumArtist:"Artist",albumTitle:"Done"},
        ],count:2});mocks.fetchBindingCandidates.mockResolvedValue({candidates:[{bindingAlbumId:"Artist/Loose",libraryAlbumId:"library-loose",scanId:"scan",rank:1,score:1,confidence:"strong",reasons:["title-exact"],title:"Loose",artist:"Artist"}]});mocks.selectBindingCandidate.mockResolvedValue({})
        render(<I18nContext.Provider value={{t:en,language:"en",setLanguage:()=>{}}}><BindingsPage/></I18nContext.Provider>)
        expect(await screen.findByText("Artist/Loose")).toBeTruthy();expect(screen.queryByText("Artist/Done")).toBeNull()
        fireEvent.click(screen.getByRole("button",{name:/Artist — Loose/}));const dialog=await screen.findByRole("dialog",{name:"Resolve album folder"});fireEvent.click(within(dialog).getByRole("button",{name:/Artist — Loose/}))
        await waitFor(()=>expect(mocks.selectBindingCandidate).toHaveBeenCalledWith("Artist/Loose","library-loose","scan"))
    })

    it("deletes a missing unresolved Binding without opening its resolver",async()=>{
        mocks.fetchBindings.mockReset();mocks.fetchBindings.mockResolvedValue({bindings:[{albumId:"Artist/Gone",relativePath:"Artist/Gone",state:"missing",matchSource:null,proposedAt:null,confirmedAt:null,libraryAlbumId:null,folderExists:false,libraryExists:false,suggestedArtist:"Artist",suggestedTitle:"Gone"}],count:1});mocks.deleteBinding.mockResolvedValue(undefined);vi.spyOn(window,"confirm").mockReturnValue(true)
        render(<I18nContext.Provider value={{t:en,language:"en",setLanguage:()=>{}}}><BindingsPage/></I18nContext.Provider>)
        const path=await screen.findByText("Artist/Gone");const card=path.closest("article")??path.closest("div.binding-card")
        fireEvent.click(within(card as HTMLElement).getByRole("button",{name:"Delete"}))
        await waitFor(()=>expect(mocks.deleteBinding).toHaveBeenCalledWith("Artist/Gone"));expect(screen.queryByRole("dialog",{name:"Resolve album folder"})).toBeNull()
    })
})
