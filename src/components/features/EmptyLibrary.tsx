import Button from "../ui/Button"
import Card from "../ui/Card"
import { useI18n } from "../../i18n/useI18n"

type EmptyLibraryProps = {
    onNavigateToBindings: () => void
    disabled?: boolean
}

function EmptyLibrary({ onNavigateToBindings, disabled = false }: EmptyLibraryProps) {
    const { t } = useI18n()

    return (
        <Card>
            <h2>{t.emptyLibrary.title}</h2>

            <p>{t.emptyLibrary.description}</p>

            <Button onClick={onNavigateToBindings} disabled={disabled}>
                {t.emptyLibrary.cta}
            </Button>

        </Card>
    )
}

export default EmptyLibrary
