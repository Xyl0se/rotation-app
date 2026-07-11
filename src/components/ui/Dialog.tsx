import type { ReactNode } from "react"

type DialogProps = {
    open: boolean
    children: ReactNode
    onClose?: () => void
}

function Dialog({ open, children, onClose }: DialogProps) {

    if (!open) {
        return null
    }

    return (
        <div className="dialog-overlay" onClick={onClose}>

            <div className="dialog" onClick={e => e.stopPropagation()}>

                {children}

            </div>

        </div>
    )
}

export default Dialog