import { useI18n } from "../../../i18n/useI18n"
import { useAlbumSession } from "../../../hooks/useAlbumSession"
import { useBindings } from "../../../hooks/useBindings"
import Button from "../../ui/Button"

interface StartAlbumSessionButtonProps {
    albumId: string
    albumTitle: string
    variant?: "primary" | "secondary"
    className?: string
}

function isActiveSessionFor(
    state: { kind: string; albumId?: string },
    albumId: string
): boolean {
    return state.kind !== "idle" && state.kind !== "stopping" && state.albumId === albumId
}

export default function StartAlbumSessionButton({
    albumId,
    albumTitle,
    variant = "primary",
    className,
}: StartAlbumSessionButtonProps) {
    const { t } = useI18n()
    const { state, start, pause, resume } = useAlbumSession()
    const { getBindingForLibraryAlbum } = useBindings()

    const binding = getBindingForLibraryAlbum(albumId)

    const isLoading = state.kind === "loading" && state.albumId === albumId
    const isPlaying = state.kind === "playing" && isActiveSessionFor(state, albumId)
    const isPaused = state.kind === "paused" && isActiveSessionFor(state, albumId)

    let unavailabilityReason: string | null = null
    if (!binding) {
        unavailabilityReason = t.playbackUnavailable.noBinding
    } else if (binding.state !== "confirmed") {
        unavailabilityReason = t.playbackUnavailable.unconfirmedBinding
    }

    function handlePlayPause() {
        if (isPlaying) {
            pause()
        } else if (isPaused) {
            resume()
        } else {
            start(albumId)
        }
    }

    if (unavailabilityReason) {
        return (
            <span className={`album-session-unavailable ${className ?? ""}`} role="status">
                {unavailabilityReason}
            </span>
        )
    }

    if (isLoading) {
        return (
            <span className={`album-session-loading ${className ?? ""}`} role="status">
                {t.common.loading}
            </span>
        )
    }

    return (
        <Button
            onClick={handlePlayPause}
            variant={isPlaying ? "secondary" : variant}
            className={className}
            aria-label={
                isPlaying
                    ? `${t.sessionPlayer.pause}: ${albumTitle}`
                    : isPaused
                      ? `${t.albumDetail.resume}: ${albumTitle}`
                      : `${t.albumDetail.playAlbum}: ${albumTitle}`
            }
        >
            {isPlaying
                ? t.sessionPlayer.pause
                : isPaused
                  ? t.albumDetail.resume
                  : t.albumDetail.playAlbum}
        </Button>
    )
}