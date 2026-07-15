import type { StorageAdapter } from "../../adapters/storageAdapter"

import Button from "../ui/Button"
import Card from "../ui/Card"
import BackupControls from "./backup/BackupControls"
import { useI18n } from "../../i18n/useI18n"

type EmptyLibraryProps = {
    adapter: StorageAdapter
    onDiscoverAlbum: () => void
    onBackupRestored: () => void
    disabled?: boolean
}

function EmptyLibrary({ adapter, onDiscoverAlbum, onBackupRestored, disabled = false }: EmptyLibraryProps) {
    const { t } = useI18n()

    return (
        <Card>
            <h2>{t.emptyLibrary.title}</h2>

            <p>{t.emptyLibrary.description}</p>

            <Button onClick={onDiscoverAlbum} disabled={disabled}>
                {t.emptyLibrary.cta}
            </Button>

            <hr style={{ margin: "1.5rem 0", border: "none", borderTop: "1px solid var(--color-border)" }} />

            <p style={{ marginBottom: "0.75rem" }}>
                {t.emptyLibrary.orImport}
            </p>

            <BackupControls adapter={adapter} onRestored={onBackupRestored} />
        </Card>
    )
}

export default EmptyLibrary
