import { afterEach, describe, expect, it, vi } from "vitest"
import { saveRotationPlan } from "./rotationStateService"

afterEach(() => vi.unstubAllGlobals())

describe("saveRotationPlan", () => {
    it("omits nullable server fields when accepting a reloaded draft", async () => {
        const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => new Response(
            init?.body as string,
            { status: 200, headers: { "content-type": "application/json" } },
        ))
        vi.stubGlobal("fetch", fetchMock)
        const plan = {
            id: "550e8400-e29b-41d4-a716-446655440020",
            name: "Reloaded draft",
            targetSize: 1,
            albumIds: ["550e8400-e29b-41d4-a716-446655440010"],
            items: [{ albumId: "550e8400-e29b-41d4-a716-446655440010", role: "new" as const, reason: "quota" as const }],
            roleQuotas: [{ role: "new" as const, targetCount: 1 }],
            createdAt: "2026-07-16T10:00:00.000Z",
            status: "active" as const,
            acceptedAt: "2026-07-16T13:00:00.000Z",
            archivedAt: null as unknown as undefined,
        }

        await saveRotationPlan(plan)

        const body = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body)) as Record<string, unknown>
        expect(body.acceptedAt).toBe(plan.acceptedAt)
        expect(body).not.toHaveProperty("archivedAt")
        expect(body).not.toHaveProperty("exports")
        expect(body.focusAlbumId).toBeNull()
    })
})
