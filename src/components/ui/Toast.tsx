import { useEffect, useCallback } from "react"
import { useToastContext } from "../../contexts/ToastContext"
import type { ToastType } from "../../contexts/ToastContext"

interface ToastItemProps {
    id: string
    type: ToastType
    message: string
    onDismiss: (id: string) => void
}

function ToastItem({ id, type, message, onDismiss }: ToastItemProps) {
    useEffect(() => {
        const timer = setTimeout(() => onDismiss(id), 5000)
        return () => clearTimeout(timer)
    }, [id, onDismiss])

    const icon =
        type === "success"
            ? "✅"
            : type === "error"
              ? "❌"
              : type === "warning"
                ? "⚠️"
                : "ℹ️"

    return (
        <div
            className={`toast toast--${type}`}
            role="status"
            aria-live="polite"
        >
            <span className="toast__icon">{icon}</span>
            <span className="toast__message">{message}</span>
            <button
                className="toast__dismiss"
                onClick={() => onDismiss(id)}
                aria-label="Dismiss"
            >
                ✕
            </button>
        </div>
    )
}

export default function ToastContainer() {
    const { toasts, removeToast } = useToastContext()

    const handleDismiss = useCallback(
        (id: string) => {
            removeToast(id)
        },
        [removeToast],
    )

    if (toasts.length === 0) return null

    return (
        <div
            className="toast-container"
            aria-live="polite"
            aria-atomic="true"
        >
            {toasts.map((toast) => (
                <ToastItem
                    key={toast.id}
                    id={toast.id}
                    type={toast.type}
                    message={toast.message}
                    onDismiss={handleDismiss}
                />
            ))}
        </div>
    )
}
