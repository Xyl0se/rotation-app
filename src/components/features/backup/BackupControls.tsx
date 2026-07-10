import { useRef, useState } from "react"

import type { StorageAdapter } from "../../../adapters/storageAdapter"

import {
    createBackup,
    downloadBackup,
    validateBackup,
    restoreBackup,
    BackupValidationError,
} from "../../../domain/backup/backup"

import Button from "../../ui/Button"
import Dialog from "../../ui/Dialog"

type BackupControlsProps = {
    adapter: StorageAdapter
    onRestored: () => void
}

function BackupControls({ adapter, onRestored }: BackupControlsProps) {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [pendingFile, setPendingFile] = useState<File | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    function handleExport() {
        const backup = createBackup(adapter)
        downloadBackup(backup)
        setSuccess("Backup heruntergeladen.")
        setTimeout(() => setSuccess(null), 3000)
    }

    function handleImportClick() {
        fileInputRef.current?.click()
    }

    function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0]
        if (!file) return
        setPendingFile(file)
        setError(null)
    }

    function handleCancelImport() {
        setPendingFile(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ""
        }
    }

    function handleConfirmImport() {
        if (!pendingFile) return

        const reader = new FileReader()
        reader.onload = () => {
            try {
                const text = reader.result as string
                const parsed = JSON.parse(text)
                const backup = validateBackup(parsed)
                restoreBackup(adapter, backup)
                setPendingFile(null)
                setSuccess("Backup erfolgreich wiederhergestellt. Seite wird neu geladen...")
                setTimeout(() => {
                    onRestored()
                }, 1200)
            } catch (err) {
                if (err instanceof BackupValidationError) {
                    setError(err.message)
                } else if (err instanceof SyntaxError) {
                    setError("Ungültige JSON-Datei.")
                } else {
                    setError("Fehler beim Wiederherstellen des Backups.")
                }
            } finally {
                if (fileInputRef.current) {
                    fileInputRef.current.value = ""
                }
            }
        }
        reader.onerror = () => {
            setError("Datei konnte nicht gelesen werden.")
        }
        reader.readAsText(pendingFile)
    }

    return (
        <div className="backup-controls">
            <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileChange}
                style={{ display: "none" }}
                aria-hidden="true"
            />

            <div className="backup-controls-row">
                <Button
                    variant="secondary"
                    onClick={handleExport}
                >
                    <span aria-hidden="true">↓</span>
                    Exportieren
                </Button>
                <Button
                    variant="secondary"
                    onClick={handleImportClick}
                >
                    <span aria-hidden="true">↑</span>
                    Importieren
                </Button>
            </div>

            {error && (
                <p className="backup-feedback backup-feedback--error" role="alert">
                    {error}
                </p>
            )}
            {success && (
                <p className="backup-feedback backup-feedback--success" role="status">
                    {success}
                </p>
            )}

            <Dialog open={pendingFile !== null}>
                <div className="backup-dialog-content">
                    <h3>Backup importieren</h3>
                    <p>
                        Möchtest du wirklich das Backup <strong>{pendingFile?.name}</strong> importieren?
                    </p>
                    <p className="backup-dialog-warning">
                        Alle bestehenden Daten werden überschrieben. Diese Aktion kann nicht rückgängig gemacht werden.
                    </p>
                    <div className="dialog-actions">
                        <Button
                            variant="secondary"
                            onClick={handleCancelImport}
                        >
                            Abbrechen
                        </Button>
                        <Button onClick={handleConfirmImport}>
                            Importieren
                        </Button>
                    </div>
                </div>
            </Dialog>
        </div>
    )
}

export default BackupControls
