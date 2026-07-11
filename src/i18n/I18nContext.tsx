import { createContext } from "react"

import type { Translation } from "./locales/en"
import { en } from "./locales/en"

export type Language = "de" | "en"

export interface I18nContextValue {
    t: Translation
    language: Language
    setLanguage: (lang: Language) => void
}

export const I18nContext = createContext<I18nContextValue>({
    t: en,
    language: "en",
    setLanguage: () => {},
})
