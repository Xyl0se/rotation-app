import type { ReactNode } from "react"

type ButtonProps = {

    children: ReactNode

    onClick?: () => void

    variant?: "primary" | "secondary"

    disabled?: boolean

}

function Button({

    children,

    onClick,

    variant = "primary",

    disabled = false,

}: ButtonProps) {

    return (

        <button

            className={`button ${variant}`}

            onClick={onClick}

            disabled={disabled}

        >

            {children}

        </button>

    )

}

export default Button