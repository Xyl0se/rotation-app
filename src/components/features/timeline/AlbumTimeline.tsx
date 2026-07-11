import type { Album } from "../../../types/album"

import type { ListenEvent } from "../../../domain/listening/listenEvents"

import {
    createAlbumTimeline,
} from "../../../domain/timeline/createAlbumTimeline"

import { useI18n } from "../../../i18n/I18nContext"

type AlbumTimelineProps = {

    album: Album

    listenEvents: ListenEvent[]

}

function formatDate(date: string) {

    return new Date(date).toLocaleDateString(

        undefined,

        {

            day: "2-digit",

            month: "2-digit",

            year: "numeric",

        },

    )

}

function AlbumTimeline({

    album,

    listenEvents,

}: AlbumTimelineProps) {
    const { t } = useI18n()

    const events =
        createAlbumTimeline(album, listenEvents)

    return (

        <section className="album-timeline">

            <div className="timeline-header">

                <h2>

                    Album Timeline

                </h2>

                <p>

                    {t.timeline.header}

                </p>

            </div>

            {
                events.length === 0 && (

                    <p className="timeline-empty">

                        {t.timeline.noEvents}

                    </p>

                )
            }

            {
                events.length > 0 && (

                    <ol className="timeline-list">

                        {
                            events.map(event => (

                                <li
                                    key={event.id}
                                    className="timeline-item"
                                >

                                    <time dateTime={event.date}>

                                        {formatDate(event.date)}

                                    </time>

                                    <div>

                                        <h3>

                                            {event.title}

                                        </h3>

                                        <p>

                                            {event.description}

                                        </p>

                                    </div>

                                </li>

                            ))
                        }

                    </ol>

                )
            }

        </section>

    )

}

export default AlbumTimeline
