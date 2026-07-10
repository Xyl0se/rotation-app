import { useEffect, useState } from "react"

import type { CoverOverride } from "../../types/album"

import { stringToHue, getInitials } from "../../utils/colorUtils"
import { getCachedCover, cacheCover, getCustomCover } from "../../repositories/coverCache"

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

            // 1. URL-Override: direkt verwenden
            if (coverOverride?.type === "url") {
                if (!cancelled) {
                    setDisplayUrl(coverOverride.url)
                    setIsLoading(false)
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

            // 3. Kein Cover verfügbar → Platzhalter
            if (!coverUrl) {
                if (!cancelled) {
                    setIsLoading(false)
                }
                return
            }

            // 4. Ohne albumId → direkte Anzeige (kein Caching)
            if (!albumId) {
                if (!cancelled) {
                    setDisplayUrl(coverUrl)
                    setIsLoading(false)
                }
                return
            }

            // 5. Externen Cache nutzen oder herunterladen
            try {
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
                    setDisplayUrl(coverUrl)
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

    const src = displayUrl ?? coverUrl ?? undefined

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
