import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { createListenEvent, fetchListenEvents } from "../services/api/rotationStateService"
import { useListenEvents } from "./useListenEvents"

vi.mock("../services/api/rotationStateService", () => ({
    fetchListenEvents: vi.fn(),
    createListenEvent: vi.fn(),
}))

describe("useListenEvents server ownership", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(fetchListenEvents).mockResolvedValue([])
    })

    it("keeps confirmed history unchanged on failure and supports retry", async () => {
        vi.mocked(fetchListenEvents).mockRejectedValueOnce(new Error("History unavailable"))
        const { result } = renderHook(() => useListenEvents([], true))
        await waitFor(() => expect(result.current.error).toBe("History unavailable"))
        expect(result.current.listenEvents).toEqual([])
        await act(async () => expect(await result.current.refresh()).toBe(true))
        expect(result.current.error).toBeNull()
    })

    it("adds an event only after server confirmation", async () => {
        let confirm!: (event: { id: string; albumId: string; listenedAt: string }) => void
        vi.mocked(createListenEvent).mockReturnValue(new Promise(resolve => { confirm = resolve }))
        const { result } = renderHook(() => useListenEvents([], true))
        await waitFor(() => expect(result.current.isLoading).toBe(false))
        let mutation!: Promise<boolean>
        act(() => { mutation = result.current.logListen("550e8400-e29b-41d4-a716-446655440010") })
        expect(result.current.listenEvents).toEqual([])
        await act(async () => {
            confirm({ id: "550e8400-e29b-41d4-a716-446655440030", albumId: "550e8400-e29b-41d4-a716-446655440010", listenedAt: "2026-07-16T11:00:00.000Z" })
            expect(await mutation).toBe(true)
        })
        expect(result.current.listenEvents).toHaveLength(1)
    })
})
