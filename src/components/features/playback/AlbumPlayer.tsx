import { useI18n } from "../../../i18n/useI18n.js"
import { useAlbumSession } from "../../../hooks/useAlbumSession.js"
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

function isActiveSessionFor(state: { kind: string; albumId?: string }, albumId: string): boolean {
    return state.kind !== "idle" && state.kind !== "stopping" && state.albumId === albumId
}

export default function AlbumPlayer({ albumId, albumTitle, bindingConfirmed }: AlbumPlayerProps) {
    const { t } = useI18n()
    const { state, start, pause, resume } = useAlbumSession()

    const isLoading = state.kind === "loading" && state.albumId === albumId
    const isPlaying = state.kind === "playing" && isActiveSessionFor(state, albumId)
    const isPaused = state.kind === "paused" && isActiveSessionFor(state, albumId)
    const hasError =
        (state.kind === "recoverable-error" || state.kind === "terminal-error") &&
        isActiveSessionFor(state, albumId)
    const errorMessage = hasError ? (state as { error: string }).error : null

    const manifest =
        state.kind === "playing" || state.kind === "paused" || state.kind === "recoverable-error"
            ? isActiveSessionFor(state, albumId)
                ? state.manifest
                : null
            : null

    const currentTrackIndex =
        (isPlaying || isPaused || state.kind === "recoverable-error") && isActiveSessionFor(state, albumId)
            ? state.currentTrackIndex
            : 0

    const currentTime =
        (isPlaying || isPaused || state.kind === "recoverable-error") && isActiveSessionFor(state, albumId)
            ? state.currentTime
            : 0

    const duration =
        (isPlaying || isPaused || state.kind === "recoverable-error") && isActiveSessionFor(state, albumId)
            ? state.trackDuration
            : null

    if (!bindingConfirmed) return null

    if (isLoading) {
        return (
            <section className="album-player" role="status" aria-live="polite">
                <p>{t.common.loading}</p>
            </section>
        )
    }

    if (errorMessage) {
        return (
            <section className="album-player album-player--error" role="alert">
                <p>
                    <strong>{t.albumDetail.playbackError}:</strong> {errorMessage}
                </p>
            </section>
        )
    }

    if (!manifest || manifest.tracks.length === 0) {
        return (
            <section className="album-player" aria-label={`Playback for ${albumTitle}`}>
                <div className="album-player-controls">
                    <Button onClick={() => start(albumId)} variant="primary">
                        {t.albumDetail.playAlbum}
                    </Button>
                </div>
            </section>
        )
    }

    const track = manifest.tracks[currentTrackIndex] ?? null
    const hasPlayableTracks = manifest.tracks.some((t) => t.playable)

    if (!hasPlayableTracks) {
        return (
            <section className="album-player album-player--error" role="alert">
                <p>{t.albumDetail.playbackError}: Keine abspielbaren Tracks gefunden.</p>
            </section>
        )
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

    return (
        <section className="album-player" aria-label={`Playback for ${albumTitle}`}>
            <div className="album-player-controls">
                <Button
                    onClick={handlePlayPause}
                    variant={isPlaying ? "secondary" : "primary"}
                    disabled={!track?.playable}
                >
                    {isPlaying
                        ? t.albumDetail.pause
                        : isPaused
                          ? t.albumDetail.resume
                          : t.albumDetail.playAlbum}
                </Button>
            </div>

            {track && (
                <div className="album-player-track">
                    <p className="album-player-now-playing">{t.albumDetail.nowPlaying(track.title)}</p>
                    <p className="album-player-progress">
                        {t.albumDetail.trackProgress(currentTrackIndex + 1, manifest.tracks.length)}
                        {" · "}
                        <span className="album-player-time">
                            {formatTime(currentTime)} /{" "}
                            {formatTime(duration ?? (track.duration ?? 0))}
                        </span>
                    </p>
                    {/* Progress bar — visual only, no seeking */}
                    <div
                        className="album-player-progress-bar"
                        role="progressbar"
                        aria-valuenow={Math.round(currentTime)}
                        aria-valuemin={0}
                        aria-valuemax={Math.round(duration ?? 1)}
                    >
                        <div
                            className="album-player-progress-bar__fill"
                            style={{
                                width: `${(duration ?? 0) > 0 ? (currentTime / (duration ?? 1)) * 100 : 0}%`,
                            }}
                        />
                    </div>
                </div>
            )}
        </section>
    )
}
