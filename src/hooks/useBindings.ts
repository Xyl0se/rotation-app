import { useContext } from "react"
import { BindingsContext } from "../contexts/bindingsState"

export function useBindings() {
    const value = useContext(BindingsContext)
    if (!value) throw new Error("useBindings must be used within BindingsProvider")
    return value
}
