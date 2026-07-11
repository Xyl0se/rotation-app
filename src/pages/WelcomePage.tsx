import Button from "../components/ui/Button"
import { useI18n } from "../i18n/useI18n"

type WelcomePageProps = {
    onContinue: () => void
}

function WelcomePage({
    onContinue,
}: WelcomePageProps) {
    const { t } = useI18n()

    return (
        <main className="welcome">
            <h1>{t.welcome.title}</h1>

            <h2>
                {t.welcome.subtitle.split(". ").map((line, i, arr) => (
                    <span key={i}>
                        {line}{i < arr.length - 1 ? "." : ""}
                        {i < arr.length - 1 && <br />}
                    </span>
                ))}
            </h2>

            <p>{t.welcome.description}</p>

            <Button onClick={onContinue}>
                {t.welcome.cta}
            </Button>

            <small>
                {t.welcome.version}
            </small>
        </main>
    )
}

export default WelcomePage
