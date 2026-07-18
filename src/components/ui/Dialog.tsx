import type { ReactNode } from "react"

type DialogProps = {
    open: boolean
    children: ReactNode
    onClose?: () => void
    ariaLabel?: string
}

function Dialog({ open, children, onClose,ariaLabel }: DialogProps) {

    if (!open) {
        return null
    }

    return (
        <div className="dialog-overlay" onClick={onClose}>

            <div className="dialog" role="dialog" aria-modal="true" aria-label={ariaLabel} onClick={e => e.stopPropagation()}>

                {children}

            </div>

        </div>
    )
}

export default Dialog
