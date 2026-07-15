import { useCallback, useState } from "react"
import type { ReactNode } from "react"
import { ToastContext, type Toast, type ToastType } from "./toastState"

const MAX_VISIBLE_TOASTS = 3
const AUTO_DISMISS_MS = 5000

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([])

    const addToast = useCallback((type: ToastType, message: string) => {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
        const toast: Toast = { id, type, message }

        setToasts((prev) => {
            const next = [...prev, toast]
            // Keep only the last MAX_VISIBLE_TOASTS visible toasts
            if (next.length > MAX_VISIBLE_TOASTS) {
                return next.slice(-MAX_VISIBLE_TOASTS)
            }
            return next
        })

        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id))
        }, AUTO_DISMISS_MS)
    }, [])

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
    }, [])

    return (
        <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
            {children}
        </ToastContext.Provider>
    )
}
