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
        if (!manifest || index >= manifest.tracks.length) return
        const track = manifest.tracks[index]
        if (!track.playable) {
            setError(`Track "${track.title}" ist nicht abspielbar.`)
            return
        }
        const audio = getAudio()
        audio.src = buildMediaUrl(manifest.albumId, track.opaqueTrackId)
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
        if (!manifest) return
        setError(null)
        loadTrack(index)
        const audio = getAudio()
        audio.play().then(() => {
            setIsPlaying(true)
            // Bounded preload: only preload next track
            preloadNextTrack(index + 1)
        }).catch((err: unknown) => {
            setIsPlaying(false)
            setError(getPlaybackErrorMessage(err))
        })
    }, [manifest, getAudio, loadTrack, preloadNextTrack])

    const play = useCallback(() => {
        if (!manifest) return
        const audio = getAudio()
        if (audio.paused && audio.src) {
            audio.play().then(() => {
                setIsPlaying(true)
            }).catch((err: unknown) => {
                setIsPlaying(false)
                setError(getPlaybackErrorMessage(err))
            })
        } else if (!audio.src && manifest.tracks.length > 0) {
            playTrack(0)
        }
    }, [manifest, getAudio, playTrack])

    const pause = useCallback(() => {
        const audio = audioRef.current
        if (audio && !audio.paused) {
            audio.pause()
            setIsPlaying(false)
        }
    }, [])

    const loadAlbum = useCallback(async (albumId: string) => {
        if (currentAlbumIdRef.current === albumId && manifest) return
        reset()
        setIsLoading(true)
        currentAlbumIdRef.current = albumId
        try {
            const m = await getPlaybackManifest(albumId)
            setManifest(m)
            if (m.tracks.length === 0) {
                setError("Album enthält keine abspielbaren Tracks.")
            }
        } catch (err: unknown) {
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
            setIsPlaying(false)
            setError("Fehler beim Laden des Audio-Tracks.")
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