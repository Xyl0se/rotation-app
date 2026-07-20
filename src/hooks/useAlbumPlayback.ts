import { useCallback, useEffect, useRef, useState } from "react"
import { getPlaybackManifest, buildMediaUrl, getPlaybackErrorMessage, type PlaybackManifest } from "../services/api/playbackService.js"

export interface UseAlbumPlaybackReturn {
    manifest: PlaybackManifest | null
    isLoading: boolean
    isPlaying: boolean
    currentTrackIndex: number
    currentTime: number
    duration: number
    error: string | null
    loadAlbum: (albumId: string) => Promise<void>
    play: () => void
    pause: () => void
    playTrack: (index: number) => void
    reset: () => void
}

export function useAlbumPlayback(): UseAlbumPlaybackReturn {
    const [manifest, setManifest] = useState<PlaybackManifest | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentTrackIndex, setCurrentTrackIndex] = useState(0)
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)
    const [error, setError] = useState<string | null>(null)

    const audioRef = useRef<HTMLAudioElement | null>(null)
    const preloadAudioRef = useRef<HTMLAudioElement | null>(null)
    const currentAlbumIdRef = useRef<string | null>(null)

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

    const reset = useCallback(() => {
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
        setManifest(null)
        setIsPlaying(false)
        setCurrentTrackIndex(0)
        setCurrentTime(0)
        setDuration(0)
        setError(null)
        currentAlbumIdRef.current = null
    }, [])

    const loadTrack = useCallback((index: number) => {
        console.log("[useAlbumPlayback] loadTrack index=", index, "manifest?", !!manifest)
        if (!manifest || index >= manifest.tracks.length) {
            console.log("[useAlbumPlayback] loadTrack ABORT: no manifest or index out of bounds")
            return
        }
        const track = manifest.tracks[index]
        console.log("[useAlbumPlayback] loadTrack track=", track.opaqueTrackId, "playable=", track.playable)
        if (!track.playable) {
            setError(`Track "${track.title}" ist nicht abspielbar.`)
            return
        }
        const audio = getAudio()
        const url = buildMediaUrl(manifest.albumId, track.opaqueTrackId)
        console.log("[useAlbumPlayback] loadTrack setting audio.src to", url)
        audio.src = url
        audio.load()
        setCurrentTrackIndex(index)
        setCurrentTime(0)
        setDuration(track.duration ?? 0)
    }, [manifest, getAudio])

    const preloadNextTrack = useCallback((nextIndex: number) => {
        if (!manifest || nextIndex >= manifest.tracks.length) return
        const track = manifest.tracks[nextIndex]
        if (!track.playable) return
        const preload = getPreloadAudio()
        preload.src = buildMediaUrl(manifest.albumId, track.opaqueTrackId)
        preload.load()
    }, [manifest, getPreloadAudio])

    const playTrack = useCallback((index: number) => {
        console.log("[useAlbumPlayback] playTrack index=", index)
        if (!manifest) {
            console.log("[useAlbumPlayback] playTrack ABORT: no manifest")
            return
        }
        setError(null)
        loadTrack(index)
        const audio = getAudio()
        console.log("[useAlbumPlayback] playTrack calling audio.play(), audio.src=", audio.src)
        audio.play().then(() => {
            console.log("[useAlbumPlayback] playTrack audio.play() resolved")
            setIsPlaying(true)
            // Bounded preload: only preload next track
            preloadNextTrack(index + 1)
        }).catch((err: unknown) => {
            console.error("[useAlbumPlayback] playTrack audio.play() rejected", err)
            setIsPlaying(false)
            setError(getPlaybackErrorMessage(err))
        })
    }, [manifest, getAudio, loadTrack, preloadNextTrack])

    const play = useCallback(() => {
        console.log("[useAlbumPlayback] play called")
        if (!manifest) {
            console.log("[useAlbumPlayback] play ABORT: no manifest")
            return
        }
        const audio = getAudio()
        console.log("[useAlbumPlayback] play audio.paused=", audio.paused, "audio.src=", audio.src)
        if (audio.paused && audio.src) {
            audio.play().then(() => {
                console.log("[useAlbumPlayback] play audio.play() resolved")
                setIsPlaying(true)
            }).catch((err: unknown) => {
                console.error("[useAlbumPlayback] play audio.play() rejected", err)
                setIsPlaying(false)
                setError(getPlaybackErrorMessage(err))
            })
        } else if (!audio.src && manifest.tracks.length > 0) {
            console.log("[useAlbumPlayback] play: no src, starting playTrack(0)")
            playTrack(0)
        } else {
            console.log("[useAlbumPlayback] play ABORT: audio not paused or no tracks")
        }
    }, [manifest, getAudio, playTrack])

    const pause = useCallback(() => {
        console.log("[useAlbumPlayback] pause called")
        const audio = audioRef.current
        if (audio && !audio.paused) {
            audio.pause()
            setIsPlaying(false)
        }
    }, [])

    const loadAlbum = useCallback(async (albumId: string) => {
        console.log("[useAlbumPlayback] loadAlbum albumId=", albumId, "current=", currentAlbumIdRef.current)
        if (currentAlbumIdRef.current === albumId && manifest) {
            console.log("[useAlbumPlayback] loadAlbum SKIP: already loaded")
            return
        }
        reset()
        setIsLoading(true)
        currentAlbumIdRef.current = albumId
        try {
            const m = await getPlaybackManifest(albumId)
            console.log("[useAlbumPlayback] loadAlbum manifest loaded, tracks=", m.tracks.length)
            setManifest(m)
            if (m.tracks.length === 0) {
                setError("Album enthält keine abspielbaren Tracks.")
            }
        } catch (err: unknown) {
            console.error("[useAlbumPlayback] loadAlbum manifest FAILED", err)
            setError(getPlaybackErrorMessage(err))
        } finally {
            setIsLoading(false)
        }
    }, [manifest, reset])

    useEffect(() => {
        const audio = getAudio()

        const handleTimeUpdate = () => {
            setCurrentTime(audio.currentTime)
        }

        const handleLoadedMetadata = () => {
            if (audio.duration && Number.isFinite(audio.duration)) {
                setDuration(audio.duration)
            }
        }

        const handleEnded = () => {
            if (!manifest) return
            const nextIndex = currentTrackIndex + 1
            if (nextIndex < manifest.tracks.length) {
                playTrack(nextIndex)
            } else {
                setIsPlaying(false)
                setCurrentTime(0)
            }
        }

        const handleError = () => {
            console.error("[useAlbumPlayback] Audio error event: audio.error=", audio.error, "audio.src=", audio.src)
            setIsPlaying(false)
            setError(`Audio-Fehler (code ${audio.error?.code ?? "?"}): ${audio.src || "no src"}`)
        }

        audio.addEventListener("timeupdate", handleTimeUpdate)
        audio.addEventListener("loadedmetadata", handleLoadedMetadata)
        audio.addEventListener("ended", handleEnded)
        audio.addEventListener("error", handleError)

        return () => {
            audio.removeEventListener("timeupdate", handleTimeUpdate)
            audio.removeEventListener("loadedmetadata", handleLoadedMetadata)
            audio.removeEventListener("ended", handleEnded)
            audio.removeEventListener("error", handleError)
        }
    }, [getAudio, manifest, currentTrackIndex, playTrack])

    useEffect(() => {
        return () => {
            reset()
        }
    }, [reset])

    return {
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
        playTrack,
        reset,
    }
}