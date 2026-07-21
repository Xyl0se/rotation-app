import { useCallback, useEffect, useReducer, useRef, type ReactNode } from "react"
import {
    createInitialContext,
    albumSessionReducer,
    getCurrentTrack,
} from "../domain/album-session/albumSessionState.js"
import {
    getPlaybackManifest,
    buildMediaUrl,
    getPlaybackErrorMessage,
    type PlaybackManifest,
} from "../services/api/playbackService.js"
import { AlbumSessionContext } from "./albumSessionState.js"

const RECOVERY_KEY = "rotation-album-session-recovery"
const TIME_UPDATE_THROTTLE_MS = 250

interface RecoveryRecord {
    albumId: string
    manifest: PlaybackManifest
    currentTrackIndex: number
    currentTime: number
    sessionId: string
}

function readRecovery(): RecoveryRecord | null {
    try {
        const raw = sessionStorage.getItem(RECOVERY_KEY)
        if (!raw) return null
        return JSON.parse(raw) as RecoveryRecord
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

    const getAudio = useCallback((): HTMLAudioElement => {
        if (!audioRef.current) {
            audioRef.current = new Audio()
        }
        return audioRef.current
    }, [])

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
            preload.src = buildMediaUrl(manifest.albumId, track.opaqueTrackId)
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
            // Compute the new session ID upfront before async work
            const newCtx = albumSessionReducer(ctx, { type: "START", albumId })
            const newSessionId = newCtx.lastSessionId!
            dispatch({ type: "START", albumId })

            try {
                console.log(`[AlbumSession] Loading manifest for ${albumId}, session=${newSessionId}`)
                const manifest = await getPlaybackManifest(albumId)
                console.log(`[AlbumSession] Manifest loaded: ${manifest.tracks.length} tracks, ordering=${manifest.orderingDiagnostic}`)
                dispatch({ type: "MANIFEST_LOADED", sessionId: newSessionId, manifest })
            } catch (err: unknown) {
                const msg = getPlaybackErrorMessage(err)
                console.error(`[AlbumSession] Manifest failed: ${msg}`, err)
                dispatch({ type: "MANIFEST_FAILED", sessionId: newSessionId, error: msg })
            }
        },
        [ctx]
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

    // --- React to state changes for audio control ---

    useEffect(() => {
        const state = ctx.state
        console.log(`[AlbumSession] state change: ${state.kind}`)

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
            const expectedSrc = buildMediaUrl(state.manifest.albumId, track.opaqueTrackId)

            // Only set src if it changed (prevents restart on every state tick)
            if (audio.src !== expectedSrc) {
                console.log(`[AlbumSession] setting src: ${expectedSrc.split("/").pop()}, track=${track.title}`)
                audio.src = expectedSrc
                audio.load()
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
            writeRecovery({
                albumId: state.albumId,
                manifest: state.manifest,
                currentTrackIndex: state.currentTrackIndex,
                currentTime: state.currentTime,
                sessionId: state.sessionId,
            })
            return
        }

        if (state.kind === "paused") {
            const audio = getAudio()
            if (!audio.paused) {
                audio.pause()
            }
            writeRecovery({
                albumId: state.albumId,
                manifest: state.manifest,
                currentTrackIndex: state.currentTrackIndex,
                currentTime: state.currentTime,
                sessionId: state.sessionId,
            })
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
            return
        }

        if (state.kind === "terminal-error" || state.kind === "completed") {
            clearAudio()
            writeRecovery(null)
            return
        }

        if (state.kind === "idle") {
            clearAudio()
            writeRecovery(null)
            return
        }
    }, [ctx.state, getAudio, clearAudio, preloadNextTrack])

    // --- Reload recovery ---

    useEffect(() => {
        if (recoveryDismissedRef.current) return
        const recovery = readRecovery()
        if (!recovery) return

        // Ask whether to continue (in a real UI this would be a dialog;
        // for now we clear recovery to avoid auto-play issues)
        // Workstream 90E will add the actual recovery dialog.
        // For now, just preserve the data but do not auto-start.
        recoveryDismissedRef.current = true
    }, [])

    const value = {
        state: ctx.state,
        actions: { start, pause, resume, stop, retry, restart, dismiss },
    }

    return <AlbumSessionContext.Provider value={value}>{children}</AlbumSessionContext.Provider>
}