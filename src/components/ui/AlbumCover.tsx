import { useEffect, useState } from "react"

import type { CoverOverride } from "../../types/album"

import { stringToHue, getInitials } from "../../utils/colorUtils"
import { getCachedCover, cacheCover, getCustomCover } from "../../repositories/coverCache"
import { fetchCoverUrl } from "../../services/api/coversService"

type AlbumCoverProps = {
    coverUrl?: string | null
    coverOverride?: CoverOverride
    albumId?: string
    title: string
    alt: string
    className?: string
    lazy?: boolean
}

export default function AlbumCover({
    coverUrl,
    coverOverride,
    albumId,
    title,
    alt,
    className = "",
    lazy = true,
}: AlbumCoverProps) {
    const [displayUrl, setDisplayUrl] = useState<string | null>(null)
    const [hasError, setHasError] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        let cancelled = false
        let currentBlobUrl: string | null = null

        async function resolveCover() {
            setIsLoading(true)
            setHasError(false)

            // 1. URL override: fetch as a Blob so no third-party URL reaches <img>.
            if (coverOverride?.type === "url" && !albumId) {
                try {
                    const response = await fetch(coverOverride.url)
                    if (!response.ok) throw new Error("Cover unavailable")
                    const blobUrl = URL.createObjectURL(await response.blob())
                    if (!cancelled) {
                        currentBlobUrl = blobUrl
                        setDisplayUrl(blobUrl)
                        setIsLoading(false)
                    } else URL.revokeObjectURL(blobUrl)
                } catch {
                    if (!cancelled) { setHasError(true); setIsLoading(false) }
                }
                return
            }

            // 2. Custom Override: aus IndexedDB laden
            if (coverOverride?.type === "custom" && albumId) {
                try {
                    const custom = await getCustomCover(albumId)
                    if (custom) {
                        if (!cancelled) {
                            currentBlobUrl = custom.blobUrl
                            setDisplayUrl(custom.blobUrl)
                            setIsLoading(false)
                        } else {
                            URL.revokeObjectURL(custom.blobUrl)
                        }
                        return
                    }
                } catch {
                    // Fallback auf nächste Ebene
                }
            }

            // 3. Server cache is the durable source for every persisted Album surface.
            if (albumId) {
                const serverUrl = await fetchCoverUrl(albumId)
                if (serverUrl) {
                    if (!cancelled) {
                        currentBlobUrl = serverUrl
                        setDisplayUrl(serverUrl)
                        setIsLoading(false)
                    } else URL.revokeObjectURL(serverUrl)
                    return
                }
                if (!cancelled) {
                    setHasError(true)
                    setIsLoading(false)
                }
                return
            }

            if (!coverUrl) {
                if (!cancelled) setIsLoading(false)
                return
            }

            // Unsaved preview/legacy fallback. The image is fetched as a Blob; external
            // provider URLs are never assigned directly to an <img> element.
            try {
                if (!albumId) {
                    const response = await fetch(coverUrl)
                    if (!response.ok) throw new Error("Cover unavailable")
                    const blobUrl = URL.createObjectURL(await response.blob())
                    if (!cancelled) {
                        currentBlobUrl = blobUrl
                        setDisplayUrl(blobUrl)
                        setIsLoading(false)
                    } else URL.revokeObjectURL(blobUrl)
                    return
                }
                const cached = await getCachedCover(albumId)
                if (cached) {
                    if (!cancelled) {
                        currentBlobUrl = cached.blobUrl
                        setDisplayUrl(cached.blobUrl)
                        setIsLoading(false)
                    } else {
                        URL.revokeObjectURL(cached.blobUrl)
                    }
                    return
                }

                const blobUrl = await cacheCover(albumId, coverUrl)
                if (!cancelled) {
                    currentBlobUrl = blobUrl
                    setDisplayUrl(blobUrl)
                    setIsLoading(false)
                } else {
                    URL.revokeObjectURL(blobUrl)
                }
            } catch {
                if (!cancelled) {
                    setHasError(true)
                    setIsLoading(false)
                }
            }
        }

        resolveCover()

        return () => {
            cancelled = true
            if (currentBlobUrl) {
                URL.revokeObjectURL(currentBlobUrl)
            }
        }
    }, [albumId, coverUrl, coverOverride])

    const hue = stringToHue(title)

    const showPlaceholder = (!coverUrl && !coverOverride) || hasError

    if (showPlaceholder && !isLoading) {
        return (
            <div
                className={className}
                style={{
                    background: `linear-gradient(
                        135deg,
                        hsl(${hue},70%,72%),
                        hsl(${hue},70%,55%)
                    )`,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                }}
                aria-label={alt}
            >
                <span className="album-initials">
                    {getInitials(title)}
                </span>
            </div>
        )
    }

    const src = displayUrl ?? undefined

    return (
        <div className={`album-cover-wrapper ${className}`} style={{ position: "relative" }}>
            {isLoading && (
                <div
                    className="album-cover-skeleton"
                    style={{
                        position: "absolute",
                        inset: 0,
                        background: `linear-gradient(
                            135deg,
                            hsl(${hue},70%,72%),
                            hsl(${hue},70%,55%)
                        )`,
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        animation: "album-cover-pulse 1.5s ease-in-out infinite",
                        zIndex: 1,
                    }}
                    aria-hidden="true"
                >
                    <span className="album-initials">
                        {getInitials(title)}
                    </span>
                </div>
            )}
            {src && (
                <img
                    className={className}
                    src={src}
                    alt={alt}
                    loading={lazy ? "lazy" : undefined}
                    onError={() => setHasError(true)}
                    onLoad={() => setIsLoading(false)}
                    style={{
                        opacity: isLoading ? 0 : 1,
                        transition: "opacity 200ms ease",
                    }}
                />
            )}
        </div>
    )
}
