import { useState } from "react"
import { useI18n } from "../../../i18n/useI18n.js"
import { useAlbumSession } from "../../../hooks/useAlbumSession.js"
import { getTrackContext } from "../../../domain/album-session/trackTimeline.js"
import AlbumProgress from "./AlbumProgress.js"
import AlbumCover from "../../ui/AlbumCover.js"

export default function AlbumSessionBand() {
    const { t } = useI18n()
    const { state, pause, resume, stop, restart, albumProgress } = useAlbumSession()
    const [expanded, setExpanded] = useState(false)
    const [showRestartConfirm, setShowRestartConfirm] = useState(false)

    // Band is only visible when there's an active session
    const isVisible =
        state.kind === "playing" ||
        state.kind === "paused" ||
        state.kind === "recoverable-error" ||
        state.kind === "completed"

    if (!isVisible) return null

    const manifest =
        state.kind === "playing" || state.kind === "paused" || state.kind === "recoverable-error" || state.kind === "completed"
            ? state.manifest
            : null

    if (!manifest) return null

    const currentTrackIndex =
        state.kind === "playing" || state.kind === "paused" || state.kind === "recoverable-error"
            ? state.currentTrackIndex
            : 0

    const currentTime =
        state.kind === "playing" || state.kind === "paused" || state.kind === "recoverable-error"
            ? state.currentTime
            : 0

    const trackDuration =
        state.kind === "playing" || state.kind === "paused" || state.kind === "recoverable-error"
            ? state.trackDuration
            : null

    const isPlaying = state.kind === "playing"
    const isPaused = state.kind === "paused"
    const isRecoverableError = state.kind === "recoverable-error"
    const isCompleted = state.kind === "completed"

    const trackContext = getTrackContext(state)

    function handlePlayPause() {
        if (isPlaying) {
            pause()
        } else if (isPaused || isRecoverableError) {
            resume()
        }
    }

    function handleStop() {
        stop()
        setExpanded(false)
        setShowRestartConfirm(false)
    }

    function handleRestart() {
        if (!showRestartConfirm) {
            setShowRestartConfirm(true)
            return
        }
        restart()
        setShowRestartConfirm(false)
    }

    return (
        <div className="album-session-band" role="region" aria-label="Album session player">
            <div className="album-session-band__inner">
                {/* Album cover */}
                <div className="album-session-band__cover">
                    <AlbumCover
                        albumId={manifest.albumId}
                        title={manifest.title}
                        alt={t.common.coverOf(manifest.title)}
                        className="album-session-band__cover-img"
                        lazy={false}
                    />
                </div>

                {/* Info column */}
                <div className="album-session-band__info">
                    <div className="album-session-band__meta">
                        <span className="album-session-band__artist">{manifest.artist}</span>
                        <span className="album-session-band__album" aria-hidden="true">
                            {" — "}
                        </span>
                        <span className="album-session-band__album">{manifest.title}</span>
                    </div>
                    {trackContext && (
                        <div className="album-session-band__track">
                            <span className="album-session-band__track-title">{trackContext.title}</span>
                            <span className="album-session-band__track-index" aria-hidden="true">
                                {" · "}
                                {t.sessionPlayer.trackOf(trackContext.current, trackContext.total)}
                            </span>
                        </div>
                    )}
                </div>

                {/* Controls */}
                <div className="album-session-band__controls">
                    <button
                        type="button"
                        className="album-session-band__btn album-session-band__btn--primary"
                        onClick={handlePlayPause}
                        aria-label={isPlaying ? t.sessionPlayer.pause : t.sessionPlayer.play}
                    >
                        {isPlaying ? "⏸" : "▶"}
                    </button>

                    <button
                        type="button"
                        className="album-session-band__btn album-session-band__btn--secondary"
                        onClick={handleStop}
                        aria-label={t.sessionPlayer.stop}
                    >
                        {"⏹"}
                    </button>

                    <button
                        type="button"
                        className="album-session-band__btn album-session-band__btn--secondary"
                        onClick={() => setExpanded((e) => !e)}
                        aria-label={expanded ? t.sessionPlayer.collapse : t.sessionPlayer.expand}
                        aria-expanded={expanded}
                    >
                        {expanded ? "▲" : "▼"}
                    </button>
                </div>
            </div>

            {/* Expanded detail area */}
            {expanded && (
                <div className="album-session-band__detail">
                    {isRecoverableError && (
                        <p className="album-session-band__error" role="alert">
                            {(state as { error: string }).error}
                        </p>
                    )}

                    {isCompleted && <p className="album-session-band__completed">Album completed</p>}

                    <button
                        type="button"
                        className="album-session-band__btn album-session-band__btn--secondary"
                        onClick={handleRestart}
                        aria-label={t.sessionPlayer.restart}
                    >
                        {showRestartConfirm ? t.sessionPlayer.confirmRestart : t.sessionPlayer.restart}
                    </button>

                    {showRestartConfirm && (
                        <button
                            type="button"
                            className="album-session-band__btn album-session-band__btn--text"
                            onClick={() => setShowRestartConfirm(false)}
                        >
                            Cancel
                        </button>
                    )}
                </div>
            )}

            {/* Whole-album progress */}
            <AlbumProgress
                manifest={manifest}
                currentTrackIndex={currentTrackIndex}
                currentTime={currentTime}
                trackDuration={trackDuration}
                albumProgress={albumProgress}
            />
        </div>
    )
}