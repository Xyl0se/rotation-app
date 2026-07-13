import { describe, it, expect, vi } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { ToastProvider, useToastContext } from "./ToastContext"

describe("ToastContext", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ToastProvider>{children}</ToastProvider>
    )

    it("starts with empty toasts", () => {
        const { result } = renderHook(() => useToastContext(), { wrapper })
        expect(result.current.toasts).toEqual([])
    })

    it("adds a toast", () => {
        const { result } = renderHook(() => useToastContext(), { wrapper })
        act(() => {
            result.current.addToast("success", "Test message")
        })
        expect(result.current.toasts).toHaveLength(1)
        expect(result.current.toasts[0].type).toBe("success")
        expect(result.current.toasts[0].message).toBe("Test message")
    })

    it("removes a toast", () => {
        const { result } = renderHook(() => useToastContext(), { wrapper })
        act(() => {
            result.current.addToast("info", "Test")
        })
        const id = result.current.toasts[0].id
        act(() => {
            result.current.removeToast(id)
        })
        expect(result.current.toasts).toHaveLength(0)
    })

    it("caps at max 3 visible toasts", () => {
        const { result } = renderHook(() => useToastContext(), { wrapper })
        act(() => {
            result.current.addToast("info", "1")
            result.current.addToast("info", "2")
            result.current.addToast("info", "3")
            result.current.addToast("info", "4")
        })
        expect(result.current.toasts).toHaveLength(3)
        // Should keep the last 3
        expect(result.current.toasts[0].message).toBe("2")
        expect(result.current.toasts[2].message).toBe("4")
    })

    it("auto-dismisses toasts after 5 seconds", async () => {
        vi.useFakeTimers()
        const { result } = renderHook(() => useToastContext(), { wrapper })
        act(() => {
            result.current.addToast("info", "Dismiss me")
        })
        expect(result.current.toasts).toHaveLength(1)
        act(() => {
            vi.advanceTimersByTime(5000)
        })
        expect(result.current.toasts).toHaveLength(0)
        vi.useRealTimers()
    })
})
