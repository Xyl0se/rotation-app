import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { act, renderHook, waitFor } from "@testing-library/react"
import type { ReactNode } from "react"
import { ConnectionProvider } from "./ConnectionContext"
import { useConnection } from "./connectionState"
import type { RetryReporter } from "../services/api/retryFetch"

const mocks = vi.hoisted(() => ({
    probeApi: vi.fn(),
    reporter: null as RetryReporter | null,
}))

vi.mock("../services/api/apiClient", () => ({
    probeApi: mocks.probeApi,
}))

vi.mock("../services/api/retryFetch", () => ({
    setRetryReporter: vi.fn((reporter: RetryReporter | null) => {
        mocks.reporter = reporter
    }),
}))

function wrapper({ children }: { children: ReactNode }) {
    return <ConnectionProvider>{children}</ConnectionProvider>
}

describe("ConnectionProvider", () => {
    beforeEach(() => {
        mocks.probeApi.mockReset()
        mocks.reporter = null
        Object.defineProperty(navigator, "onLine", { value: true, configurable: true })
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it("distinguishes a reachable API from browser network availability", async () => {
        mocks.probeApi.mockResolvedValue(true)
        const { result } = renderHook(useConnection, { wrapper })

        expect(result.current.isOnline).toBe(true)
        await waitFor(() => expect(result.current.apiReachable).toBe(true))
        expect(result.current.lastApiCheckAt).not.toBeNull()
    })

    it("marks the API unreachable while the browser remains online", async () => {
        mocks.probeApi.mockRejectedValue(new TypeError("Failed to fetch"))
        const { result } = renderHook(useConnection, { wrapper })

        await waitFor(() => expect(result.current.apiReachable).toBe(false))
        expect(result.current.isOnline).toBe(true)
    })

    it("keeps retry state for other concurrent requests", async () => {
        mocks.probeApi.mockResolvedValue(true)
        const { result } = renderHook(useConnection, { wrapper })
        await waitFor(() => expect(mocks.reporter).not.toBeNull())

        act(() => {
            mocks.reporter?.onRetrying(1, 1, 3)
            mocks.reporter?.onRetrying(2, 2, 3)
        })
        expect(result.current.isRetrying).toBe(true)
        expect(result.current.retryCount).toBe(2)

        act(() => mocks.reporter?.onOnline(1))
        expect(result.current.isRetrying).toBe(true)
        expect(result.current.retryCount).toBe(2)

        act(() => mocks.reporter?.onOnline(2))
        expect(result.current.isRetrying).toBe(false)
        expect(result.current.retryCount).toBe(0)
    })

    it("aborts an in-flight API probe on unmount", async () => {
        let observedSignal: AbortSignal | undefined
        mocks.probeApi.mockImplementation((signal?: AbortSignal) => {
            observedSignal = signal
            return new Promise(() => {})
        })
        const { unmount } = renderHook(useConnection, { wrapper })
        await waitFor(() => expect(observedSignal).toBeDefined())

        unmount()

        expect(observedSignal?.aborted).toBe(true)
    })

    it("bounds an API probe with a three-second timeout", async () => {
        vi.useFakeTimers()
        mocks.probeApi.mockImplementation((signal?: AbortSignal) => new Promise((_resolve, reject) => {
            signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")))
        }))
        const { result } = renderHook(useConnection, { wrapper })

        await act(async () => {
            await vi.advanceTimersByTimeAsync(3000)
        })

        expect(result.current.apiReachable).toBe(false)
    })

    it("re-probes the API when browser connectivity returns", async () => {
        mocks.probeApi
            .mockRejectedValueOnce(new TypeError("Failed to fetch"))
            .mockResolvedValueOnce(true)
        const { result } = renderHook(useConnection, { wrapper })
        await waitFor(() => expect(result.current.apiReachable).toBe(false))

        act(() => window.dispatchEvent(new Event("online")))

        await waitFor(() => expect(result.current.apiReachable).toBe(true))
        expect(mocks.probeApi).toHaveBeenCalledTimes(2)
    })
})
