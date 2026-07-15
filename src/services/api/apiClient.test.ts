import { afterEach, describe, expect, it, vi } from "vitest"
import { post } from "./apiClient"

describe("apiClient trusted proxy authentication", () => {
    afterEach(() => vi.unstubAllGlobals())

    it("never reads or sends a browser write token", async () => {
        const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
            void input
            void init
            return new Response(JSON.stringify({ ok: true }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            })
        })
        vi.stubGlobal("fetch", fetchMock)
        vi.stubGlobal("localStorage", {
            getItem: vi.fn(() => {
                throw new Error("API client must not read browser secrets")
            }),
        })

        await post("/test", { value: 1 })

        const options = fetchMock.mock.calls[0]?.[1] as RequestInit
        const headers = options.headers as Record<string, string>
        expect(headers["x-rotation-write-token"]).toBeUndefined()
        expect(headers["X-Rotation-Write-Token"]).toBeUndefined()
    })
})
