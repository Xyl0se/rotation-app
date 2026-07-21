import { useState } from "react"
import { useI18n } from "../../../i18n/useI18n.js"
import { useAlbumSession } from "../../../hooks/useAlbumSession.js"
import { getTrackContext } from "../../../domain/album-session/trackTimeline.js"
import AlbumProgress from "./AlbumProgress.js"
import AlbumCover from "../../ui/AlbumCover.js"
import ListeningJournalEditor from "../listening/ListeningJournalEditor.js"
import { saveListeningJournal, deleteListeningJournal } from "../../../services/api/rotationStateService.js"
import type { Album } from "../../../types/album.js"

export default function AlbumSessionBand() {
    const { t } = useI18n()
    const { state, pause, resume, stop, restart, albumProgress, completedEvent, dismissCompletedEvent } = useAlbumSession()
    const [expanded, setExpanded] = useState(false)
    const [showRestartConfirm, setShowRestartConfirm] = useState(false)
    const [showJournal, setShowJournal] = useState(false)

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
        setShowJournal(false)
    }

    function handleRestart() {
        if (!showRestartConfirm) {
            setShowRestartConfirm(true)
            return
        }
        restart()
        setShowRestartConfirm(false)
    }

    function handleDismissJournal() {
        setShowJournal(false)
        dismissCompletedEvent()
    }

    async function handleSaveJournal(id: string, draft: { note: string; moodTags: string[]; contextTags: string[] }): Promise<boolean> {
        const result = await saveListeningJournal(id, {
            note: draft.note,
            moodTags: draft.moodTags as ("calm" | "energized" | "melancholic" | "curious" | "nostalgic")[],
            contextTags: draft.contextTags as ("focused" | "background" | "on-the-go" | "evening" | "shared")[],
        })
        return result !== null
    }

    async function handleDeleteJournal(id: string): Promise<boolean> {
        try {
            await deleteListeningJournal(id)
            return true
        } catch {
            return false
        }
    }

    // Build a minimal Album from manifest data for the journal editor
    const journalAlbum: Album | undefined = completedEvent
        ? {
            id: manifest.albumId,
            title: manifest.title,
            artist: manifest.artist,
            year: "",
            roleHistory: [],
            listenCount: 0,
            lastListened: null,
        }
        : undefined

    // Status announcement for screen readers
    const statusText = (() => {
        if (isRecoverableError) return (state as { error: string }).error
        if (isCompleted) return t.sessionPlayer.albumCompleted
        if (isPlaying && trackContext) return t.sessionPlayer.nowPlaying(manifest.artist, manifest.title)
        return null
    })()

    return (
        <div className="album-session-band" role="region" aria-label={t.sessionPlayer.nowPlaying(manifest.artist, manifest.title)}>
            {/* Live region for dynamic status announcements */}
            <div aria-live="polite" aria-atomic="true" className="sr-only">
                {statusText}
            </div>

            <div className="album-session-band__chassis">
                {/* Four corner screw heads */}
                <div className="album-session-band__screw album-session-band__screw--tl" aria-hidden="true" />
                <div className="album-session-band__screw album-session-band__screw--tr" aria-hidden="true" />
                <div className="album-session-band__screw album-session-band__screw--bl" aria-hidden="true" />
                <div className="album-session-band__screw album-session-band__screw--br" aria-hidden="true" />

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

                    {/* Display window with glossy overlay */}
                    <div className="album-session-band__display-window">
                        <div className="album-session-band__display-glass" aria-hidden="true" />
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
                    </div>

                    {/* Controls */}
                    <div className="album-session-band__controls">
                        <button
                            type="button"
                            className="album-session-band__btn album-session-band__btn--primary album-session-band__btn--physical"
                            onClick={handlePlayPause}
                            aria-label={isPlaying ? t.sessionPlayer.pause : t.sessionPlayer.play}
                            aria-pressed={isPlaying}
                        >
                            {isPlaying ? "⏸" : "▶"}
                        </button>

                        <button
                            type="button"
                            className="album-session-band__btn album-session-band__btn--secondary album-session-band__btn--physical"
                            onClick={handleStop}
                            aria-label={t.sessionPlayer.stop}
                        >
                            {"⏹"}
                        </button>

                        <button
                            type="button"
                            className="album-session-band__btn album-session-band__btn--secondary album-session-band__btn--physical"
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

                        {isCompleted && <p className="album-session-band__completed">{t.sessionPlayer.albumCompleted}</p>}

                        {isCompleted && completedEvent && !showJournal && (
                            <button
                                type="button"
                                className="album-session-band__btn album-session-band__btn--secondary album-session-band__btn--physical"
                                onClick={() => setShowJournal(true)}
                            >
                                {t.sessionPlayer.writeInJournal}
                            </button>
                        )}

                        {/* Restart button/confirmation - hidden when journal offer is active */}
                        {!(isCompleted && completedEvent && !showJournal) && (
                            showRestartConfirm ? (
                                <div role="alertdialog" aria-labelledby="restart-confirm-title" className="album-session-band__confirm">
                                    <p id="restart-confirm-title" className="album-session-band__confirm-text">
                                        {t.sessionPlayer.confirmRestart}
                                    </p>
                                    <div className="album-session-band__confirm-actions">
                                        <button
                                            type="button"
                                            className="album-session-band__btn album-session-band__btn--secondary album-session-band__btn--physical"
                                            onClick={handleRestart}
                                            aria-label={t.sessionPlayer.restart}
                                        >
                                            {t.sessionPlayer.restart}
                                        </button>
                                        <button
                                            type="button"
                                            className="album-session-band__btn album-session-band__btn--text"
                                            onClick={() => setShowRestartConfirm(false)}
                                        >
                                            {t.common.cancel}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    className="album-session-band__btn album-session-band__btn--secondary album-session-band__btn--physical"
                                    onClick={handleRestart}
                                    aria-label={t.sessionPlayer.restart}
                                >
                                    {t.sessionPlayer.restart}
                                </button>
                            )
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

            {/* Listening Journal Editor overlay */}
            {showJournal && completedEvent && journalAlbum && (
                <ListeningJournalEditor
                    event={completedEvent}
                    album={journalAlbum}
                    onClose={handleDismissJournal}
                    onSave={handleSaveJournal}
                    onDelete={handleDeleteJournal}
                />
            )}
        </div>
    )
}