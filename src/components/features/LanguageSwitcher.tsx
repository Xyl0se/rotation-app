import { useI18n, type Language } from "../../i18n/I18nContext"

export function LanguageSwitcher() {
    const { language, setLanguage } = useI18n()

    return (
        <select
            value={language}
            onChange={e => setLanguage(e.target.value as Language)}
            aria-label="Language"
            style={{
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "inherit",
                padding: "4px 8px",
                borderRadius: "4px",
                fontSize: "0.85rem",
                cursor: "pointer",
            }}
        >
            <option value="de">DE</option>
            <option value="en">EN</option>
        </select>
    )
}
