import { useMemo } from "react"
import { getTrackBoundaries, isDiscBoundary } from "../../../domain/album-session/trackTimeline.js"
import type { PlaybackManifest } from "../../../services/api/playbackService.js"

interface AlbumProgressProps {
    manifest: PlaybackManifest
    currentTrackIndex: number
    currentTime: number
    trackDuration: number | null
    albumProgress: number
}

export default function AlbumProgress({
    manifest,
    currentTrackIndex,
    currentTime,
    trackDuration,
    albumProgress,
}: AlbumProgressProps) {
    const boundaries = useMemo(() => getTrackBoundaries(manifest), [manifest])

    const elapsed = useMemo(() => {
        let time = 0
        for (let i = 0; i < currentTrackIndex; i++) {
            time += manifest.tracks[i]?.duration ?? trackDuration ?? 0
        }
        const currentTrackDuration = manifest.tracks[currentTrackIndex]?.duration ?? trackDuration ?? 0
        time += Math.min(currentTime, currentTrackDuration)
        return time
    }, [manifest, currentTrackIndex, currentTime, trackDuration])

    const total = useMemo(() => {
        return manifest.totalDuration ?? manifest.tracks.reduce((sum, t) => sum + (t.duration ?? 0), 0)
    }, [manifest])

    const percent = Math.min(100, Math.max(0, albumProgress * 100))

    return (
        <div
            className="album-progress"
            role="progressbar"
            aria-valuenow={Math.round(percent)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Album progress: ${Math.round(percent)} percent`}
        >
            <div className="album-progress__track">
                {boundaries.map((boundary, index) => {
                    const isCurrent = index === currentTrackIndex
                    const isDiscBreak = isDiscBoundary(boundaries, index)

                    return (
                        <div
                            key={boundary.trackIndex}
                            className={`album-progress__tick ${isCurrent ? "album-progress__tick--current" : ""} ${isDiscBreak ? "album-progress__tick--disc" : ""}`}
                            style={{ left: `${boundary.startPercent}%` }}
                            aria-hidden="true"
                        />
                    )
                })}
                <div
                    className="album-progress__fill"
                    style={{ width: `${percent}%` }}
                    aria-hidden="true"
                />
            </div>
            <div className="album-progress__time" aria-live="off">
                <span className="album-progress__elapsed">{formatTime(elapsed)}</span>
                <span className="album-progress__separator" aria-hidden="true">
                    {" "}
                    /{" "}
                </span>
                <span className="album-progress__total">{formatTime(total)}</span>
            </div>
        </div>
    )
}

function formatTime(seconds: number): string {
    if (!Number.isFinite(seconds) || seconds < 0) return "0:00"
    const totalSeconds = Math.round(seconds)
    const h = Math.floor(totalSeconds / 3600)
    const m = Math.floor((totalSeconds % 3600) / 60)
    const s = totalSeconds % 60
    const mm = String(m).padStart(2, "0")
    const ss = String(s).padStart(2, "0")
    if (h > 0) {
        return `${h}:${mm}:${ss}`
    }
    return `${m}:${ss}`
}