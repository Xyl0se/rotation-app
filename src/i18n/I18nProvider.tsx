import type { ReactNode } from "react"
import { useCallback, useState } from "react"

import { I18nContext } from "./I18nContext"
import type { Language } from "./I18nContext"
import { de } from "./locales/de"
import { en } from "./locales/en"
import type { Translation } from "./locales/en"

const translations: Record<Language, Translation> = { de, en }

export function I18nProvider({ children }: { children: ReactNode }) {
    const stored = (localStorage.getItem("rotation-language") as Language) ?? "en"
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
