import { useCallback } from "react"
import { useToastContext } from "../contexts/toastState"
import type { ToastType } from "../contexts/toastState"

export function useToast() {
    const { addToast } = useToastContext()

    const toast = useCallback(
        (type: ToastType, message: string) => {
            addToast(type, message)
        },
        [addToast],
    )

    const success = useCallback(
        (message: string) => {
            addToast("success", message)
        },
        [addToast],
    )

    const error = useCallback(
        (message: string) => {
            addToast("error", message)
        },
        [addToast],
    )

    const info = useCallback(
        (message: string) => {
            addToast("info", message)
        },
        [addToast],
    )

    const warning = useCallback(
        (message: string) => {
            addToast("warning", message)
        },
        [addToast],
    )

    return { toast, success, error, info, warning }
}
