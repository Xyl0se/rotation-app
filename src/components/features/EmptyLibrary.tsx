import type { StorageAdapter } from "../../adapters/storageAdapter"

import Button from "../ui/Button"
import Card from "../ui/Card"
import BackupControls from "./backup/BackupControls"

type EmptyLibraryProps = {
    adapter: StorageAdapter
    onDiscoverAlbum: () => void
    onBackupRestored: () => void
}

function EmptyLibrary({ adapter, onDiscoverAlbum, onBackupRestored }: EmptyLibraryProps) {
    return (
        <Card>

            <h2>Noch keine Alben</h2>

            <p>
                Beginne deine persönliche Musiksammlung,
                indem du dein erstes Album hinzufügst.
            </p>

            <Button onClick={onDiscoverAlbum}>
                Neues Album entdecken
            </Button>

            <hr style={{ margin: "1.5rem 0", border: "none", borderTop: "1px solid var(--color-border)" }} />

            <p style={{ marginBottom: "0.75rem" }}>
                Oder importiere ein bestehendes Backup:
            </p>

            <BackupControls adapter={adapter} onRestored={onBackupRestored} />

        </Card>
    )
}

export default EmptyLibrary
