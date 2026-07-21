import type { Album } from "../../../types/album"

import type { ListenEvent } from "../../../domain/listening/listenEvents"

import {
    getRoleSince,
} from "../../../domain/album/roleHistoryHelpers"

import AlbumCover from "../../ui/AlbumCover"
import AlbumTimeline from "../timeline/AlbumTimeline"
import { useI18n } from "../../../i18n/useI18n"
import StartAlbumSessionButton from "../playback/StartAlbumSessionButton"

function StoryBadge({ label, value }: { label: string; value: string }) {
    return (
        <span className="story-badge">
            <span className="story-badge-label">{label}</span>
            <span className="story-badge-value">{value}</span>
        </span>
    )
}

function AlbumStory({ story }: { story: NonNullable<Album["story"]> }) {
    const { t } = useI18n()

    return (
        <div className="album-story">
            <div className="story-badges">
                {story.acquiredBecause && (
                    <StoryBadge
                        label={t.albumStory.why}
                        value={t.acquisitionReasons[story.acquiredBecause]}
                    />
                )}
                {story.lifePhase && (
                    <StoryBadge
                        label={t.albumStory.when}
                        value={t.lifePhases[story.lifePhase]}
                    />
                )}
            </div>
            {story.memoryNote && (
                <blockquote className="story-note">
                    {story.memoryNote}
                </blockquote>
            )}
        </div>
    )
}

type FocusAlbumCardProps = {

    album: Album

    listenEvents: ListenEvent[]

    onLogListen: () => void

    onSuggestAnother: () => void

    onEdit: () => void

    onEditJournal?: (eventId:string)=>void

    onOpenAlbum?: (albumId: string) => void

}

function formatLastListened(date: string | null, t: ReturnType<typeof useI18n>["t"]) {

    if (!date) {

        return t.focusAlbum.noListenSession

    }

    return new Date(date).toLocaleDateString(

        undefined,

        {

            day: "numeric",

            month: "long",

            year: "numeric",

        },

    )

}

function formatRoleSince(album: Album) {

    const roleSince = getRoleSince(album)

    if (!roleSince) {

        return null

    }

    return new Date(roleSince).toLocaleDateString(

        undefined,

        {

            day: "2-digit",

            month: "2-digit",

            year: "numeric",

        },

    )

}

function FocusAlbumCard({

    album,

    listenEvents,

    onLogListen,
    onSuggestAnother,
    onEdit,
    onEditJournal,
    onOpenAlbum,

}: FocusAlbumCardProps) {

    const { t } = useI18n()
    const roleSince =
        formatRoleSince(album)

    return (

        <section className="focus-album">

            <div className="focus-album-heading">
                <p className="focus-album-label">{t.focusAlbum.label}</p>
                <div className="focus-album-heading-actions">
                    <button
                        className="focus-album-edit"
                        onClick={onEdit}
                        aria-label={`${t.albumCard.edit}: ${album.title}`}
                        title={t.albumCard.edit}
                    >
                        ✎
                    </button>
                    <button
                        className="focus-album-shuffle"
                        onClick={onSuggestAnother}
                        aria-label={t.home.suggestFocusAlbum}
                        title={t.home.suggestFocusAlbum}
                    >
                        🎲
                    </button>
                </div>
            </div>

            <div className="focus-album-hero">

                <button
                    className="focus-album-cover-button"
                    onClick={() => onOpenAlbum?.(album.id)}
                    aria-label={`${album.title} von ${album.artist} öffnen`}
                >
                    <AlbumCover
                        coverUrl={album.coverUrl}
                        coverOverride={album.coverOverride}
                        albumId={album.id}
                        title={album.title}
                        alt={album.title}
                        className="focus-album-cover"
                        lazy={false}
                    />
                </button>

                <div className="focus-album-info">

                    <h1>

                        <button
                            className="focus-album-title-button"
                            onClick={() => onOpenAlbum?.(album.id)}
                        >
                            {album.title}
                        </button>

                    </h1>

                    <h3>

                        {album.artist}

                    </h3>

                    <div className="focus-album-meta">

                        {album.year}

                    </div>

                    {

                        roleSince && (

                            <div className="focus-album-meta">

                                {t.focusAlbum.roleSince} {roleSince}

                            </div>

                        )

                    }

                </div>

                <aside className="focus-album-listening" aria-label={t.focusAlbum.listenCountLabel}>
                    <StartAlbumSessionButton
                        albumId={album.id}
                        albumTitle={album.title}
                        variant="primary"
                        compact
                        className="listen-button"
                    />
                    <button
                        className="listen-button"
                        onClick={onLogListen}
                        aria-label={`${t.focusAlbum.listened}: ${album.title}`}
                    >
                        {t.focusAlbum.listened}
                    </button>

                    <div className="focus-album-stats">

                        <div>

                            <strong>

                                {album.listenCount}

                            </strong>

                            <span>

                                {t.focusAlbum.listenCountLabel}

                            </span>

                        </div>

                        <div>

                            <strong>

                                {formatLastListened(

                                    album.lastListened, t

                                )}

                            </strong>

                            <span>

                                {t.focusAlbum.lastListenedLabel}

                            </span>

                        </div>

                    </div>

                </aside>

            </div>

            {album.story && (
                <AlbumStory story={album.story} />
            )}

            <details className="focus-timeline-popover">
                <summary>{t.focusAlbum.timeline}</summary>
                <div className="focus-timeline-panel">
                    <AlbumTimeline album={album} listenEvents={listenEvents} onEditJournal={onEditJournal} />
                </div>
            </details>

        </section>

    )

}

export default FocusAlbumCard
