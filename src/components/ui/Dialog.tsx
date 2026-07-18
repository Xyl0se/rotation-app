import { useEffect,type ReactNode } from "react"

type DialogProps = {
    open: boolean
    children: ReactNode
    onClose?: () => void
    ariaLabel?: string
}

function Dialog({ open, children, onClose,ariaLabel }: DialogProps) {

    useEffect(()=>{
        if(!open||!onClose)return
        const close=(event:KeyboardEvent)=>{if(event.key==="Escape")onClose()}
        document.addEventListener("keydown",close)
        return()=>document.removeEventListener("keydown",close)
    },[open,onClose])

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
