import { createContext, useContext } from "react"

export type ToastType = "success" | "error" | "info" | "warning"

export interface Toast {
    id: string
    type: ToastType
    message: string
}

export interface ToastContextValue {
    toasts: Toast[]
    addToast: (type: ToastType, message: string) => void
    removeToast: (id: string) => void
}

export const ToastContext = createContext<ToastContextValue>({
    toasts: [],
    addToast: () => {},
    removeToast: () => {},
})

export function useToastContext() {
    return useContext(ToastContext)
}
