import type { Album, AlbumAcquisitionReason, AlbumLifePhase } from "../../../types/album"

import type { ListenEvent } from "../../../domain/listening/listenEvents"

import {
    getRoleSince,
} from "../../../domain/album/roleHistoryHelpers"

import AlbumCover from "../../ui/AlbumCover"
import AlbumTimeline from "../timeline/AlbumTimeline"

const ACQUISITION_LABELS: Record<AlbumAcquisitionReason, string> = {
    artist: "Künstler",
    "friend-recommendation": "Empfehlung",
    "specific-song": "Song",
    concert: "Konzert",
    review: "Rezension",
    "record-store": "Plattenladen",
    gift: "Geschenk",
    "random-discovery": "Zufall",
    "life-phase": "Lebensphase",
    other: "Sonstiges",
}

const LIFE_PHASE_LABELS: Record<AlbumLifePhase, string> = {
    childhood: "Kindheit",
    school: "Schulzeit",
    studies: "Studium",
    "first-apartment": "Erste Wohnung",
    relationship: "Beziehung",
    breakup: "Trennung",
    work: "Beruf",
    travel: "Reise",
    family: "Familie",
    current: "Aktuell",
    other: "Andere",
}

function StoryBadge({ label, value }: { label: string; value: string }) {
    return (
        <span className="story-badge">
            <span className="story-badge-label">{label}</span>
            <span className="story-badge-value">{value}</span>
        </span>
    )
}

function AlbumStory({ story }: { story: NonNullable<Album["story"]> }) {
    return (
        <div className="album-story">
            <div className="story-badges">
                {story.acquiredBecause && (
                    <StoryBadge
                        label="Warum"
                        value={ACQUISITION_LABELS[story.acquiredBecause]}
                    />
                )}
                {story.lifePhase && (
                    <StoryBadge
                        label="Wann"
                        value={LIFE_PHASE_LABELS[story.lifePhase]}
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

}

function formatLastListened(date: string | null) {

    if (!date) {

        return "Noch keine Hörsession"

    }

    return new Date(date).toLocaleDateString(

        "de-DE",

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

        "de-DE",

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

}: FocusAlbumCardProps) {

    const roleSince =
        formatRoleSince(album)

    return (

        <section className="focus-album">

            <p className="focus-album-label">

                Fokusalbum

            </p>

            <div className="focus-album-hero">

                <AlbumCover
                    coverUrl={album.coverUrl}
                    coverOverride={album.coverOverride}
                    albumId={album.id}
                    title={album.title}
                    alt={album.title}
                    className="focus-album-cover"
                    lazy={false}
                />

                <div className="focus-album-info">

                    <h1>

                        {album.title}

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

                                Aktuelle Rolle seit {roleSince}

                            </div>

                        )

                    }

                    <div className="focus-album-stats">

                        <div>

                            <strong>

                                {album.listenCount}

                            </strong>

                            <span>

                                Hörsessions

                            </span>

                        </div>

                        <div>

                            <strong>

                                {formatLastListened(

                                    album.lastListened,

                                )}

                            </strong>

                            <span>

                                Zuletzt gehört

                            </span>

                        </div>

                    </div>

                    <button

                        className="listen-button"

                        onClick={onLogListen}

                        aria-label={`Erfassen, dass du ${album.title} gehört hast`}

                    >

                        Gehört

                    </button>

                </div>

            </div>

            {album.story && (
                <AlbumStory story={album.story} />
            )}

            <AlbumTimeline

                album={album}

                listenEvents={listenEvents}

            />

        </section>

    )

}

export default FocusAlbumCard
