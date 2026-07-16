import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { chooseRandomServerFocus, fetchRotationState, saveRotationPlan, setServerFocus } from "../services/api/rotationStateService"
import { useRotationPlan } from "./useRotationPlan"

vi.mock("../services/api/rotationStateService", () => ({
    fetchRotationState: vi.fn(),
    saveRotationPlan: vi.fn(),
    setServerFocus: vi.fn(),
    chooseRandomServerFocus: vi.fn(),
}))

const active = {
    id: "550e8400-e29b-41d4-a716-446655440020", name: "Rotation", targetSize: 1,
    albumIds: ["550e8400-e29b-41d4-a716-446655440010"],
    items: [{ albumId: "550e8400-e29b-41d4-a716-446655440010", role: "new" as const, reason: "quota" as const }],
    roleQuotas: [{ role: "new" as const, targetCount: 1 }], createdAt: "2026-07-16T10:00:00.000Z",
    status: "active" as const, acceptedAt: "2026-07-16T10:01:00.000Z", focusAlbumId: null,
}

describe("useRotationPlan server ownership", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(fetchRotationState).mockResolvedValue({ active, draft: null })
    })

    it("loads confirmed state and recovers through explicit refresh after failure", async () => {
        vi.mocked(fetchRotationState).mockRejectedValueOnce(new Error("Server unavailable"))
        const { result } = renderHook(() => useRotationPlan([], true))
        await waitFor(() => expect(result.current.error).toBe("Server unavailable"))
        expect(result.current.rotationPlan).toBeNull()

        await act(async () => expect(await result.current.refresh()).toBe(true))
        expect(result.current.rotationPlan).toMatchObject({ id: active.id })
        expect(result.current.error).toBeNull()
    })

    it("does not apply an unconfirmed focus mutation", async () => {
        vi.mocked(setServerFocus).mockRejectedValueOnce(new Error("Write failed"))
        const { result } = renderHook(() => useRotationPlan([], true))
        await waitFor(() => expect(result.current.rotationPlan).not.toBeNull())
        await act(async () => expect(await result.current.setFocusAlbumId(active.albumIds[0]!)).toBe(false))
        expect(result.current.focusAlbumId).toBeNull()
        expect(result.current.error).toBe("Write failed")
    })

    it("updates random focus only with the server-confirmed member", async () => {
        vi.mocked(chooseRandomServerFocus).mockResolvedValue({ ...active, focusAlbumId: active.albumIds[0]! })
        const { result } = renderHook(() => useRotationPlan([], true))
        await waitFor(() => expect(result.current.rotationPlan).not.toBeNull())
        await act(async () => expect(await result.current.suggestFocusAlbum()).toBe(true))
        expect(result.current.focusAlbumId).toBe(active.albumIds[0])
        expect(saveRotationPlan).not.toHaveBeenCalled()
    })
})
