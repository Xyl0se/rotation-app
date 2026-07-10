import type { ReactNode } from "react"

type DialogProps = {
    open: boolean
    children: ReactNode
}

function Dialog({ open, children }: DialogProps) {

    if (!open) {
        return null
    }

    return (
        <div className="dialog-overlay">

            <div className="dialog">

                {children}

            </div>

        </div>
    )
}

export default Dialog