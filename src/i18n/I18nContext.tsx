import type { ReactNode } from "react"
import { createContext, useCallback, useContext, useState } from "react"
import type { Translation } from "./locales/en"
import { de } from "./locales/de"
import { en } from "./locales/en"

export type Language = "de" | "en"

const translations: Record<Language, Translation> = { de, en }

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

export function I18nProvider({ children }: { children: ReactNode }) {
    const stored = (localStorage.getItem("rotation-language") as Language) ?? "de"
    const [language, setLanguageState] = useState<Language>(stored)

    const setLanguage = useCallback((lang: Language) => {
        localStorage.setItem("rotation-language", lang)
        setLanguageState(lang)
    }, [])

    return (
        <I18nContext.Provider
            value={{
                t: translations[language],
                language,
                setLanguage,
            }}
        >
            {children}
        </I18nContext.Provider>
    )
}

export function useI18n(): I18nContextValue {
    return useContext(I18nContext)
}
