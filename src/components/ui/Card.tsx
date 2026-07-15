import type { ReactNode } from "react"

type CardProps = {
    children: ReactNode
    className?: string
    id?: string
}

function Card({ children, className, id }: CardProps) {
    return (
        <div className={`card${className ? ` ${className}` : ""}`} id={id}>
            {children}
        </div>
    )
}

export default Card