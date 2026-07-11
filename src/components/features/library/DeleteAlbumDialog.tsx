import type { Album } from "../../../types/album"

import Button from "../../ui/Button"
import Dialog from "../../ui/Dialog"
import { useI18n } from "../../../i18n/I18nContext"

type DeleteAlbumDialogProps = {
    album: Album | undefined
    onCancel: () => void
    onConfirm: (id: string) => void
}

function DeleteAlbumDialog({ album, onCancel, onConfirm }: DeleteAlbumDialogProps) {
    const { t } = useI18n()

    return (
        <Dialog open={album !== undefined}>
            {album && (
                <div className="delete-dialog">
                    <h3>{t.deleteDialog.title}</h3>
                    <p>{t.deleteDialog.description}</p>
                    <div className="dialog-actions">
                        <Button variant="secondary" onClick={onCancel}>
                            {t.deleteDialog.cancel}
                        </Button>
                        <Button variant="primary" onClick={() => onConfirm(album.id)}>
                            {t.deleteDialog.confirm}
                        </Button>
                    </div>
                </div>
            )}
        </Dialog>
    )
}

export default DeleteAlbumDialog
