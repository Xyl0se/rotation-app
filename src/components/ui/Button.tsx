import type { ReactNode } from "react"

type ButtonProps = {

    children: ReactNode

    onClick?: () => void

    variant?: "primary" | "secondary"

    disabled?: boolean
    title?: string

}

function Button({

    children,

    onClick,

    variant = "primary",

    disabled = false,
    title,

}: ButtonProps) {

    return (

        <button

            className={`button ${variant}`}

            onClick={onClick}

            disabled={disabled}
            title={title}

        >

            {children}

        </button>

    )

}

export default Button