import { useState, useRef, useEffect } from "react"

import type { Album } from "../../../types/album"

import type { RoleId } from "../../../domain/roles"

import { roles } from "../../../domain/roles"

import type {
    RotationPlanItem,
} from "../../../domain/rotation-plan/rotationPlan"

import type { ListenEvent } from "../../../domain/listening/listenEvents"

import { explainRotationItem } from "../../../domain/rotation-explainability/explainRotationItem"

import { createAlbumTimeline } from "../../../domain/timeline/createAlbumTimeline"

import AlbumCover from "../../ui/AlbumCover"

import { useI18n } from "../../../i18n/useI18n"

function getRoleTitle(role: RoleId): string {
    return roles.find(item => item.id === role)?.title ?? role
}

function getRoleIcon(role: RoleId): string {
    return roles.find(item => item.id === role)?.icon ?? ""
}

function formatDate(iso: string): string {
    const date = new Date(iso)
    if (Number.isNaN(date.getTime())) {
        return iso
    }
    return date.toLocaleDateString(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
    })
}

function getListenCount(
    album: Album,
    listenEvents: ListenEvent[],
): number {
    if (listenEvents.length > 0) {
        return listenEvents.filter(e => e.albumId === album.id).length
    }
    return album.listenCount
}

function getLastListenedText(
    album: Album,
    listenEvents: ListenEvent[],
): string | null {
    if (listenEvents.length > 0) {
        const event = listenEvents
            .filter(e => e.albumId === album.id)
            .sort(
                (a, b) =>
                    new Date(b.listenedAt).getTime() -
                    new Date(a.listenedAt).getTime(),
            )[0]
        if (event) {
            return formatDate(event.listenedAt)
        }
    }
    if (album.lastListened) {
        return formatDate(album.lastListened)
    }
    return null
}

type RotationTileTooltipProps = {
    album: Album
    item: RotationPlanItem
    listenEvents: ListenEvent[]
    children?: React.ReactNode
}

function RotationTileTooltip({
    album,
    item,
    listenEvents,
}: RotationTileTooltipProps) {
    const { t } = useI18n()

    const [isVisible, setIsVisible] = useState(false)
    const wrapperRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!isVisible) {
            return
        }

        function handleClickOutside(event: MouseEvent) {
            if (
                wrapperRef.current &&
                !wrapperRef.current.contains(event.target as Node)
            ) {
                setIsVisible(false)
            }
        }

        document.addEventListener("mousedown", handleClickOutside)

        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [isVisible])

    const explanation =
        explainRotationItem(album, item, listenEvents)

    const timeline =
        createAlbumTimeline(album, listenEvents)
            .slice(0, 3)

    const listenCount = getListenCount(album, listenEvents)
    const lastListened = getLastListenedText(album, listenEvents)

    return (
        <div
            ref={wrapperRef}
            className="rotation-tooltip-wrapper"
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
            <AlbumCover
                coverUrl={album.coverUrl}
                coverOverride={album.coverOverride}
                albumId={album.id}
                title={album.title}
                alt={t.common.coverOf(album.title)}
                className="player-rotation-cover"
            />

            {
                isVisible && (
                    <div className="rotation-tooltip">
                        <div className="rotation-tooltip-header">
                            <span className="rotation-tooltip-role">
                                {getRoleIcon(item.role)}{" "}
                                {getRoleTitle(item.role)}
                            </span>
                            <h4>{album.title}</h4>
                            <p>{album.artist}</p>
                        </div>

                        <div className="rotation-tooltip-explanation">
                            {explanation.text}
                        </div>

                        <div className="rotation-tooltip-stats">
                            <div>
                                <strong>{listenCount}</strong>
                                <span>
                                    {t.playerRotation.tooltip.listenSessions(listenCount)}
                                </span>
                            </div>
                            {
                                lastListened && (
                                    <div>
                                        <strong>{lastListened}</strong>
                                        <span>{t.playerRotation.tooltip.lastListened}</span>
                                    </div>
                                )
                            }
                        </div>

                        {
                            timeline.length > 0 && (
                                <div className="rotation-tooltip-timeline">
                                    <p className="timeline-label">
                                        {t.timeline.latestEvents}
                                    </p>
                                    <ul>
                                        {
                                            timeline.map(event => (
                                                <li key={event.id}>
                                                    <time>
                                                        {formatDate(event.date)}
                                                    </time>
                                                    <span>
                                                        {event.title}
                                                    </span>
                                                </li>
                                            ))
                                        }
                                    </ul>
                                </div>
                            )
                        }
                    </div>
                )
            }
        </div>
    )
}

export default RotationTileTooltip
