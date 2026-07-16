import { useI18n } from "../../i18n/useI18n"

function Header() {
    const { t } = useI18n()

    return (
        <header className="hero">
            <h1>{t.header.title}</h1>

            <p>
                Personal Music Quality Management System
            </p>
        </header>
    )
}

export default Header
