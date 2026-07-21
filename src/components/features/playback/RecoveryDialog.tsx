import { useI18n } from "../../../i18n/useI18n.js"
import { getPlaybackManifest, type PlaybackManifest } from "../../../services/api/playbackService.js"
import { isManifestCompatible } from "../../../domain/album-session/albumSessionState.js"
import Dialog from "../../ui/Dialog.js"
import AlbumCover from "../../ui/AlbumCover.js"

export type RecoveryChoice = "continue" | "restart" | "dismiss"

interface RecoveryDialogProps {
    open: boolean
    albumId: string
    manifest: PlaybackManifest
    onChoice: (choice: RecoveryChoice, freshManifest?: PlaybackManifest) => void
}

export default function RecoveryDialog({ open, albumId, manifest, onChoice }: RecoveryDialogProps) {
    const { t } = useI18n()

    async function handleContinue() {
        try {
            const freshManifest = await getPlaybackManifest(albumId)
            if (!isManifestCompatible(manifest, freshManifest)) {
                // Manifest changed; fall back to restart with fresh manifest
                onChoice("restart", freshManifest)
                return
            }
            onChoice("continue")
        } catch {
            // If we can't verify, still allow continue with stored manifest
            onChoice("continue")
        }
    }

    function handleRestart() {
        onChoice("restart")
    }

    function handleDismiss() {
        onChoice("dismiss")
    }

    return (
        <Dialog open={open} onClose={handleDismiss} ariaLabel={t.recoveryDialog.title}>
            <div className="recovery-dialog">
                <div className="recovery-dialog__header">
                    <AlbumCover
                        albumId={albumId}
                        title={manifest.title}
                        alt={t.common.coverOf(manifest.title)}
                        className="recovery-dialog__cover"
                        lazy={false}
                    />
                    <h2 className="recovery-dialog__title">{t.recoveryDialog.title}</h2>
                </div>
                <p className="recovery-dialog__description">
                    {t.recoveryDialog.description(manifest.title)}
                </p>
                <div className="recovery-dialog__actions">
                    <button
                        type="button"
                        className="recovery-dialog__btn recovery-dialog__btn--primary"
                        onClick={handleContinue}
                    >
                        {t.recoveryDialog.continue}
                    </button>
                    <button
                        type="button"
                        className="recovery-dialog__btn recovery-dialog__btn--secondary"
                        onClick={handleRestart}
                    >
                        {t.recoveryDialog.restart}
                    </button>
                    <button
                        type="button"
                        className="recovery-dialog__btn recovery-dialog__btn--text"
                        onClick={handleDismiss}
                    >
                        {t.recoveryDialog.dismiss}
                    </button>
                </div>
            </div>
        </Dialog>
    )
}