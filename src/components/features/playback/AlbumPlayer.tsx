import { useEffect } from "react"
import { useI18n } from "../../../i18n/useI18n.js"
import { useAlbumPlayback } from "../../../hooks/useAlbumPlayback.js"
import Button from "../../ui/Button.js"

interface AlbumPlayerProps {
    albumId: string
    albumTitle: string
    bindingConfirmed: boolean
}

function formatTime(seconds: number): string {
    if (!Number.isFinite(seconds) || seconds < 0) return "0:00"
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}:${String(s).padStart(2, "0")}`
}

export default function AlbumPlayer({ albumId, albumTitle, bindingConfirmed }: AlbumPlayerProps) {
    const { t } = useI18n()
    const {
        manifest,
        isLoading,
        isPlaying,
        currentTrackIndex,
        currentTime,
        duration,
        error,
        loadAlbum,
        play,
        pause,
        reset,
    } = useAlbumPlayback()

    useEffect(() => {
        if (bindingConfirmed && !manifest) {
            loadAlbum(albumId)
        }
    }, [albumId, bindingConfirmed, loadAlbum, manifest])

    useEffect(() => {
        return () => {
            reset()
        }
    }, [reset])

    if (!bindingConfirmed) return null

    if (isLoading) {
        return (
            <section className="album-player" role="status" aria-live="polite">
                <p>{t.common.loading}</p>
            </section>
        )
    }

    if (error) {
        return (
            <section className="album-player album-player--error" role="alert">
                <p><strong>{t.albumDetail.playbackError}:</strong> {error}</p>
            </section>
        )
    }

    if (!manifest || manifest.tracks.length === 0) {
        return null
    }

    const currentTrack = manifest.tracks[currentTrackIndex] ?? null
    const hasPlayableTracks = manifest.tracks.some(t => t.playable)

    if (!hasPlayableTracks) {
        return (
            <section className="album-player album-player--error" role="alert">
                <p>{t.albumDetail.playbackError}: Keine abspielbaren Tracks gefunden.</p>
            </section>
        )
    }

    return (
        <section className="album-player" aria-label={`Playback for ${albumTitle}`}>
            <div className="album-player-controls">
                <Button
                    onClick={isPlaying ? pause : play}
                    variant={isPlaying ? "secondary" : "primary"}
                    disabled={!currentTrack?.playable}
                >
                    {isPlaying ? t.albumDetail.pause : currentTime > 0 ? t.albumDetail.resume : t.albumDetail.playAlbum}
                </Button>
            </div>

            {currentTrack && (
                <div className="album-player-track">
                    <p className="album-player-now-playing">
                        {t.albumDetail.nowPlaying(currentTrack.title)}
                    </p>
                    <p className="album-player-progress">
                        {t.albumDetail.trackProgress(currentTrackIndex + 1, manifest.tracks.length)}
                        {" · "}
                        <span className="album-player-time">
                            {formatTime(currentTime)} / {formatTime(duration || (currentTrack.duration ?? 0))}
                        </span>
                    </p>
                    {/* Progress bar — visual only, no seeking */}
                    <div className="album-player-progress-bar" role="progressbar" aria-valuenow={Math.round(currentTime)} aria-valuemin={0} aria-valuemax={Math.round(duration || 1)}>
                        <div
                            className="album-player-progress-bar__fill"
                            style={{
                                width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
                            }}
                        />
                    </div>
                </div>
            )}
        </section>
    )
}