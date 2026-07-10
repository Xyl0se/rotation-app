import type { Album } from "../../../types/album"

import type { ListenEvent } from "../../../domain/listening/listenEvents"

import {
    createAlbumTimeline,
} from "../../../domain/timeline/createAlbumTimeline"

type AlbumTimelineProps = {

    album: Album

    listenEvents: ListenEvent[]

}

function formatDate(date: string) {

    return new Date(date).toLocaleDateString(

        "de-DE",

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

    const events =
        createAlbumTimeline(album, listenEvents)

    return (

        <section className="album-timeline">

            <div className="timeline-header">

                <h2>

                    Album Timeline

                </h2>

                <p>

                    Die bisher dokumentierte Geschichte
                    dieses Albums.

                </p>

            </div>

            {
                events.length === 0 && (

                    <p className="timeline-empty">

                        Noch keine dokumentierten Ereignisse.

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
