import { useCallback, useEffect, useReducer, useRef, useState, type ReactNode } from "react"
import {
    createInitialContext,
    albumSessionReducer,
    getCurrentTrack,
    generateSessionId,
    createRecoveryRecord,
    isRecoveryRecordValid,
    type RecoveryRecord,
} from "../domain/album-session/albumSessionState.js"
import {
    getPlaybackManifest,
    buildMediaUrl,
    getPlaybackErrorMessage,
    type PlaybackManifest,
} from "../services/api/playbackService.js"
import { AlbumSessionContext } from "./albumSessionState.js"
import RecoveryDialog from "../components/features/playback/RecoveryDialog.js"
import type { RecoveryChoice } from "../components/features/playback/RecoveryDialog.js"

const RECOVERY_KEY = "rotation-album-session-recovery"
const TIME_UPDATE_THROTTLE_MS = 250

function readRecovery(): RecoveryRecord | null {
    try {
        const raw = sessionStorage.getItem(RECOVERY_KEY)
        if (!raw) return null
        const parsed = JSON.parse(raw) as unknown
        if (!isRecoveryRecordValid(parsed)) return null
        return parsed
    } catch {
        return null
    }
}

function writeRecovery(record: RecoveryRecord | null) {
    try {
        if (record) {
            sessionStorage.setItem(RECOVERY_KEY, JSON.stringify(record))
        } else {
            sessionStorage.removeItem(RECOVERY_KEY)
        }
    } catch {
        // sessionStorage may be unavailable; silently ignore
    }
}

export function AlbumSessionProvider({ children }: { children: ReactNode }) {
    const [ctx, dispatch] = useReducer(albumSessionReducer, undefined, createInitialContext)

    const audioRef = useRef<HTMLAudioElement | null>(null)
    const preloadAudioRef = useRef<HTMLAudioElement | null>(null)
    const lastTimeUpdateRef = useRef(0)
    const recoveryDismissedRef = useRef(false)
    const previousStateKindRef = useRef<string | null>(null)

    const [recoveryDialog, setRecoveryDialog] = useState<{
        open: boolean
        albumId: string
        manifest: PlaybackManifest
        currentTrackIndex: number
        currentTime: number
        sessionId: string
    } | null>(null)

    const getAudio = useCallback((): HTMLAudioElement => {
        if (!audioRef.current) {
            audioRef.current = new Audio()
        }
        return audioRef.current
    }, [])

    function resolveMediaUrl(albumId: string, opaqueTrackId: string): string {
        return new URL(buildMediaUrl(albumId, opaqueTrackId), window.location.origin).href
    }

    function resolveCoverUrl(albumId: string): string {
        return new URL(`/api/covers/${encodeURIComponent(albumId)}`, window.location.origin).href
    }

    function clearMediaSession() {
        if ("mediaSession" in navigator) {
            navigator.mediaSession.metadata = null
            try {
                navigator.mediaSession.setActionHandler("play", null)
                navigator.mediaSession.setActionHandler("pause", null)
            } catch {
                // Some platforms throw when clearing handlers
            }
        }
    }


    const getPreloadAudio = useCallback((): HTMLAudioElement => {
        if (!preloadAudioRef.current) {
            preloadAudioRef.current = new Audio()
            preloadAudioRef.current.preload = "auto"
        }
        return preloadAudioRef.current
    }, [])

    const preloadNextTrack = useCallback(
        (manifest: PlaybackManifest, nextIndex: number) => {
            if (nextIndex >= manifest.tracks.length) return
            const track = manifest.tracks[nextIndex]
            if (!track?.playable) return
            const preload = getPreloadAudio()
            preload.src = resolveMediaUrl(manifest.albumId, track.opaqueTrackId)
            preload.load()
        },
        [getPreloadAudio]
    )

    const clearAudio = useCallback(() => {
        const audio = audioRef.current
        if (audio) {
            audio.pause()
            audio.removeAttribute("src")
            audio.load()
        }
        const preload = preloadAudioRef.current
        if (preload) {
            preload.pause()
            preload.removeAttribute("src")
            preload.load()
        }
    }, [])

    // --- Actions exposed to consumers ---

    const start = useCallback(
        async (albumId: string) => {
            // Generate session ID once and reuse it for both dispatches
            const sessionId = generateSessionId()
            dispatch({ type: "START", albumId, sessionId })

            try {
                console.log(`[AlbumSession] Loading manifest for ${albumId}, session=${sessionId}`)
                const manifest = await getPlaybackManifest(albumId)
                console.log(`[AlbumSession] Manifest loaded: ${manifest.tracks.length} tracks, ordering=${manifest.orderingDiagnostic}`)
                dispatch({ type: "MANIFEST_LOADED", sessionId, manifest })
            } catch (err: unknown) {
                const msg = getPlaybackErrorMessage(err)
                console.error(`[AlbumSession] Manifest failed: ${msg}`, err)
                dispatch({ type: "MANIFEST_FAILED", sessionId, error: msg })
            }
        },
        []
    )

    const pause = useCallback(() => {
        const sessionId = ctx.lastSessionId
        if (!sessionId) return
        dispatch({ type: "PAUSE", sessionId })
    }, [ctx])

    const resume = useCallback(() => {
        const sessionId = ctx.lastSessionId
        if (!sessionId) return
        dispatch({ type: "RESUME", sessionId })
    }, [ctx])

    const stop = useCallback(() => {
        const sessionId = ctx.lastSessionId
        if (!sessionId) return
        dispatch({ type: "STOP", sessionId })
    }, [ctx])

    const retry = useCallback(() => {
        const sessionId = ctx.lastSessionId
        if (!sessionId) return
        dispatch({ type: "RETRY", sessionId })
    }, [ctx])

    const restart = useCallback(() => {
        const sessionId = ctx.lastSessionId
        if (!sessionId) return
        dispatch({ type: "RESTART", sessionId })
    }, [ctx])

    const dismiss = useCallback(() => {
        const sessionId = ctx.lastSessionId
        if (!sessionId) return
        dispatch({ type: "DISMISS_ERROR", sessionId })
    }, [ctx])

    // --- Recovery dialog handler ---

    const handleRecoveryChoice = useCallback(
        (choice: RecoveryChoice, freshManifest?: PlaybackManifest) => {
            if (!recoveryDialog) return

            if (choice === "dismiss") {
                writeRecovery(null)
                setRecoveryDialog(null)
                recoveryDismissedRef.current = true
                return
            }

            const sessionId = generateSessionId()
            const manifest = freshManifest ?? recoveryDialog.manifest

            if (choice === "continue") {
                dispatch({
                    type: "RECOVER",
                    sessionId,
                    albumId: recoveryDialog.albumId,
                    manifest,
                    currentTrackIndex: recoveryDialog.currentTrackIndex,
                    currentTime: recoveryDialog.currentTime,
                })
            } else if (choice === "restart") {
                dispatch({
                    type: "RECOVER",
                    sessionId,
                    albumId: recoveryDialog.albumId,
                    manifest,
                    currentTrackIndex: 0,
                    currentTime: 0,
                })
            }

            writeRecovery(null)
            setRecoveryDialog(null)
            recoveryDismissedRef.current = true
        },
        [recoveryDialog]
    )

    // --- Audio event wiring ---

    useEffect(() => {
        const audio = getAudio()

        const handleTimeUpdate = () => {
            const now = performance.now()
            if (now - lastTimeUpdateRef.current < TIME_UPDATE_THROTTLE_MS) return
            lastTimeUpdateRef.current = now

            const sessionId = ctx.lastSessionId
            if (!sessionId) return
            dispatch({
                type: "TIME_UPDATE",
                sessionId,
                currentTime: audio.currentTime,
                trackDuration: Number.isFinite(audio.duration) ? audio.duration : null,
            })
        }

        const handleLoadedMetadata = () => {
            const sessionId = ctx.lastSessionId
            if (!sessionId) return
            console.log(`[AlbumSession] loadedmetadata: duration=${audio.duration}, src=${audio.src.split("/").pop()}`)
            if (Number.isFinite(audio.duration)) {
                dispatch({
                    type: "TIME_UPDATE",
                    sessionId,
                    currentTime: audio.currentTime,
                    trackDuration: audio.duration,
                })
            }
        }

        const handleEnded = () => {
            const sessionId = ctx.lastSessionId
            console.log(`[AlbumSession] ended event, session=${sessionId}, state=${ctx.state.kind}`)
            if (!sessionId) return
            if (ctx.state.kind !== "playing") return
            dispatch({ type: "TRACK_ENDED", sessionId, trackIndex: ctx.state.currentTrackIndex })
        }

        const handleError = () => {
            const sessionId = ctx.lastSessionId
            const errCode = audio.error?.code ?? "unknown"
            const errMsg = audio.error?.message ?? "unknown"
            console.error(`[AlbumSession] audio error: code=${errCode}, msg=${errMsg}, src=${audio.src.split("/").pop()}, networkState=${audio.networkState}, readyState=${audio.readyState}`)
            if (!sessionId) return
            // Network errors during load are recoverable; decode errors are terminal
            const isRecoverable = audio.error?.code === MediaError.MEDIA_ERR_NETWORK
            dispatch({
                type: "AUDIO_ERROR",
                sessionId,
                error: audio.error?.message ?? "Fehler beim Laden des Audio-Tracks.",
                recoverable: isRecoverable,
            })
        }

        const handlePlay = () => {
            console.log(`[AlbumSession] play event, src=${audio.src.split("/").pop()}`)
        }

        const handlePause = () => {
            console.log(`[AlbumSession] pause event, currentTime=${audio.currentTime}`)
        }

        audio.addEventListener("timeupdate", handleTimeUpdate)
        audio.addEventListener("loadedmetadata", handleLoadedMetadata)
        audio.addEventListener("ended", handleEnded)
        audio.addEventListener("error", handleError)
        audio.addEventListener("play", handlePlay)
        audio.addEventListener("pause", handlePause)

        return () => {
            audio.removeEventListener("timeupdate", handleTimeUpdate)
            audio.removeEventListener("loadedmetadata", handleLoadedMetadata)
            audio.removeEventListener("ended", handleEnded)
            audio.removeEventListener("error", handleError)
            audio.removeEventListener("play", handlePlay)
            audio.removeEventListener("pause", handlePause)
        }
    }, [getAudio, ctx.lastSessionId, ctx.state.kind, ctx.state])

    // --- Media Session API ---

    useEffect(() => {
        if (!("mediaSession" in navigator)) return

        const state = ctx.state

        if (
            state.kind !== "playing" &&
            state.kind !== "paused" &&
            state.kind !== "recoverable-error"
        ) {
            clearMediaSession()
            return
        }

        const track = getCurrentTrack(state)
        if (!track) {
            clearMediaSession()
            return
        }

        const artwork: MediaImage[] = []
        if (state.manifest.coverPath || state.manifest.albumId) {
            artwork.push({
                src: resolveCoverUrl(state.manifest.albumId),
                sizes: "512x512",
                type: "image/jpeg",
            })
        }

        navigator.mediaSession.metadata = new MediaMetadata({
            title: track.title,
            artist: state.manifest.artist,
            album: state.manifest.title,
            artwork,
        })

        try {
            navigator.mediaSession.setActionHandler("play", () => {
                resume()
            })
            navigator.mediaSession.setActionHandler("pause", () => {
                pause()
            })
            // Explicitly do NOT register seek, next, or previous handlers.
        } catch {
            // Platform may not support these actions
        }
    }, [ctx.state, resume, pause])

    // --- React to state changes for audio control ---

    useEffect(() => {
        const state = ctx.state
        console.log(`[AlbumSession] state change: ${state.kind}`)

        // Track previous state kind for transition detection
        const previousKind = previousStateKindRef.current
        previousStateKindRef.current = state.kind

        if (state.kind === "loading") {
            // Audio will be set up once manifest loads
            return
        }

        if (state.kind === "playing") {
            const track = getCurrentTrack(state)
            if (!track) {
                console.warn(`[AlbumSession] playing state but no current track (index=${state.currentTrackIndex})`)
                return
            }

            const audio = getAudio()
            const expectedSrc = resolveMediaUrl(state.manifest.albumId, track.opaqueTrackId)

            // Only set src if it changed (prevents restart on every state tick)
            if (audio.src !== expectedSrc) {
                console.log(`[AlbumSession] setting src: ${expectedSrc.split("/").pop()}, track=${track.title}`)
                audio.src = expectedSrc
                audio.load()
                // Resume from recovered position on first play of this track
                if (state.currentTime > 0) {
                    audio.currentTime = state.currentTime
                }
            }

            // Play if not already playing
            if (audio.paused) {
                console.log(`[AlbumSession] calling audio.play()`)
                audio.play().catch((err: unknown) => {
                    const errorMessage = err instanceof Error ? err.message : "Wiedergabe nicht möglich"
                    console.error(`[AlbumSession] play() rejected: ${errorMessage}`)
                    dispatch({
                        type: "AUDIO_ERROR",
                        sessionId: state.sessionId,
                        error: errorMessage,
                        recoverable: true,
                    })
                })
            }

            // Preload next track
            preloadNextTrack(state.manifest, state.currentTrackIndex + 1)

            // Write recovery record
            writeRecovery(createRecoveryRecord(
                state.sessionId,
                state.albumId,
                state.manifest,
                state.currentTrackIndex,
                state.currentTime
            ))
            return
        }

        if (state.kind === "paused") {
            const audio = getAudio()
            if (!audio.paused) {
                audio.pause()
            }
            writeRecovery(createRecoveryRecord(
                state.sessionId,
                state.albumId,
                state.manifest,
                state.currentTrackIndex,
                state.currentTime
            ))
            return
        }

        if (state.kind === "stopping") {
            clearAudio()
            dispatch({ type: "STOPPED", sessionId: state.sessionId })
            writeRecovery(null)
            return
        }

        if (state.kind === "recoverable-error") {
            const audio = getAudio()
            if (!audio.paused) {
                audio.pause()
            }
            writeRecovery(createRecoveryRecord(
                state.sessionId,
                state.albumId,
                state.manifest,
                state.currentTrackIndex,
                state.currentTime
            ))
            return
        }

        if (state.kind === "terminal-error" || state.kind === "completed") {
            clearAudio()
            writeRecovery(null)
            return
        }

        if (state.kind === "idle") {
            clearAudio()
            // Only clear recovery when transitioning TO idle from a non-idle state,
            // not on initial render where state is already idle
            if (previousKind !== null && previousKind !== "idle") {
                writeRecovery(null)
            }
            return
        }
    }, [ctx.state, getAudio, clearAudio, preloadNextTrack])

    // --- Reload recovery ---

    useEffect(() => {
        if (recoveryDismissedRef.current) return
        if (recoveryDialog) return
        const recovery = readRecovery()
        if (!recovery) return

        // Only show recovery dialog when idle (no active session)
        if (ctx.state.kind !== "idle") return

        // Defer setState to avoid cascading renders
        const timer = setTimeout(() => {
            setRecoveryDialog({
                open: true,
                albumId: recovery.albumId,
                manifest: recovery.manifest,
                currentTrackIndex: recovery.currentTrackIndex,
                currentTime: recovery.currentTime,
                sessionId: recovery.sessionId,
            })
        }, 0)

        return () => clearTimeout(timer)
    }, [ctx.state.kind, recoveryDialog])

    // --- Cleanup on unmount ---

    useEffect(() => {
        return () => {
            clearMediaSession()
        }
    }, [])

    const value = {
        state: ctx.state,
        actions: { start, pause, resume, stop, retry, restart, dismiss },
    }

    return (
        <AlbumSessionContext.Provider value={value}>
            {children}
            {recoveryDialog?.open && (
                <RecoveryDialog
                    open={true}
                    albumId={recoveryDialog.albumId}
                    manifest={recoveryDialog.manifest}
                    onChoice={handleRecoveryChoice}
                />
            )}
        </AlbumSessionContext.Provider>
    )
}