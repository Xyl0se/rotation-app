import type { Album } from "../../../types/album"

import Button from "../../ui/Button"
import Dialog from "../../ui/Dialog"

type DeleteAlbumDialogProps = {

    album: Album | undefined

    onCancel: () => void

    onConfirm: (id: string) => void

}

function DeleteAlbumDialog({

    album,

    onCancel,

    onConfirm,

}: DeleteAlbumDialogProps) {

    return (

        <Dialog open={album !== undefined}>

            {
                album && (

                    <div className="library-maintenance-dialog">

                        <h2>

                            Album wirklich löschen?

                        </h2>

                        <p>

                            <strong>{album.title}</strong> wird
                            dauerhaft aus deiner Bibliothek entfernt.
                            Diese Aktion kann nicht rückgängig gemacht
                            werden.

                        </p>

                        <div className="dialog-actions">

                            <Button
                                variant="secondary"
                                onClick={onCancel}
                            >

                                Nein

                            </Button>

                            <Button
                                onClick={() =>
                                    onConfirm(album.id)
                                }
                            >

                                Ja, löschen

                            </Button>

                        </div>

                    </div>

                )
            }

        </Dialog>

    )

}

export default DeleteAlbumDialog
