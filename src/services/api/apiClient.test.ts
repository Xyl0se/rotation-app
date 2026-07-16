import { afterEach, describe, expect, it, vi } from "vitest"
import { ApiError, getApiErrorMessage, post } from "./apiClient"

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

    it("distinguishes proxy authentication from same-origin rejection", () => {
        expect(getApiErrorMessage(new ApiError(403, {
            code: "INVALID_WRITE_TOKEN",
        }, "Forbidden"))).toContain("ROTATION_WRITE_TOKEN")

        expect(getApiErrorMessage(new ApiError(403, {
            code: "CROSS_SITE_MUTATION",
            error: "Forbidden: request Origin does not match proxy host; check NAS reverse-proxy Host forwarding",
            diagnostic: { reason: "origin-host-mismatch" },
        }, "Forbidden"))).toContain("NAS reverse-proxy Host forwarding")
    })
})
