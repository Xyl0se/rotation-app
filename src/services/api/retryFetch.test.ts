import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { retryFetch, setRetryReporter } from "./retryFetch"

describe("retryFetch", () => {
    beforeEach(() => {
        setRetryReporter(null)
        vi.useFakeTimers({ shouldAdvanceTime: true })
    })

    afterEach(() => {
        vi.useRealTimers()
        vi.restoreAllMocks()
    })

    it("returns response on first success", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValueOnce(new Response('{"ok":true}', { status: 200 })),
        )

        const response = await retryFetch("/api/test")
        expect(response.status).toBe(200)
        expect(fetch).toHaveBeenCalledTimes(1)
    })

    it("retries on 5xx and succeeds on second attempt", async () => {
        vi.stubGlobal(
            "fetch",
            vi
                .fn()
                .mockResolvedValueOnce(new Response("err", { status: 503 }))
                .mockResolvedValueOnce(new Response('{"ok":true}', { status: 200 })),
        )

        const reporter = {
            onRetrying: vi.fn(),
            onOnline: vi.fn(),
            onOffline: vi.fn(),
            onError: vi.fn(),
        }
        setRetryReporter(reporter)

        const promise = retryFetch("/api/test")
        await vi.advanceTimersByTimeAsync(1000)
        const response = await promise

        expect(response.status).toBe(200)
        expect(fetch).toHaveBeenCalledTimes(2)
        expect(reporter.onRetrying).toHaveBeenCalledWith(1, 3)
    })

    it("does not retry on 4xx", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValueOnce(new Response("not found", { status: 404 })),
        )

        const response = await retryFetch("/api/test")
        expect(response.status).toBe(404)
        expect(fetch).toHaveBeenCalledTimes(1)
    })

    it("retries on network error and succeeds", async () => {
        vi.stubGlobal(
            "fetch",
            vi
                .fn()
                .mockRejectedValueOnce(new TypeError("Failed to fetch"))
                .mockResolvedValueOnce(new Response('{"ok":true}', { status: 200 })),
        )

        const promise = retryFetch("/api/test")
        await vi.advanceTimersByTimeAsync(1000)
        const response = await promise

        expect(response.status).toBe(200)
        expect(fetch).toHaveBeenCalledTimes(2)
    })

    it("retries on timeout and succeeds", async () => {
        vi.stubGlobal(
            "fetch",
            vi
                .fn()
                .mockRejectedValueOnce(new DOMException("The operation was aborted", "AbortError"))
                .mockResolvedValueOnce(new Response('{"ok":true}', { status: 200 })),
        )

        const promise = retryFetch("/api/test")
        await vi.advanceTimersByTimeAsync(1000)
        const response = await promise

        expect(response.status).toBe(200)
        expect(fetch).toHaveBeenCalledTimes(2)
    })

    it("fails after max retries", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue(new Response("err", { status: 503 })),
        )

        const promise = retryFetch("/api/test")
        await vi.advanceTimersByTimeAsync(8000)

        await expect(promise).rejects.toThrow("Request failed after 3 retries")
        expect(fetch).toHaveBeenCalledTimes(4)
    })

    it("fails immediately when offline", async () => {
        Object.defineProperty(navigator, "onLine", { value: false, writable: true, configurable: true })

        vi.stubGlobal("fetch", vi.fn())

        const reporter = {
            onRetrying: vi.fn(),
            onOnline: vi.fn(),
            onOffline: vi.fn(),
            onError: vi.fn(),
        }
        setRetryReporter(reporter)

        await expect(retryFetch("/api/test")).rejects.toThrow("Offline")
        expect(fetch).not.toHaveBeenCalled()
        expect(reporter.onOffline).toHaveBeenCalled()

        Object.defineProperty(navigator, "onLine", { value: true, writable: true, configurable: true })
    })

    it("goes offline during retry and fails immediately", async () => {
        vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")))

        let online = true
        Object.defineProperty(navigator, "onLine", {
            get: () => online,
            configurable: true,
        })

        const promise = retryFetch("/api/test")
        online = false
        await vi.advanceTimersByTimeAsync(1000)

        await expect(promise).rejects.toThrow()

        Object.defineProperty(navigator, "onLine", { value: true, writable: true, configurable: true })
    })
})
