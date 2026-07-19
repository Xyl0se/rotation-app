import type { Album } from "../../../types/album"

import type { JournalContext,JournalMood,ListenEvent } from "../../../domain/listening/listenEvents"

import {
    createAlbumTimeline,
} from "../../../domain/timeline/createAlbumTimeline"

import { useI18n } from "../../../i18n/useI18n"

type AlbumTimelineProps = {

    album: Album

    listenEvents: ListenEvent[]

    onEditJournal?: (eventId:string)=>void

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

    onEditJournal,

}: AlbumTimelineProps) {
    const { t } = useI18n()
    const journalTagLabel=(tag:JournalMood|JournalContext)=>tag in t.journal.moods?t.journal.moods[tag as JournalMood]:t.journal.contexts[tag as JournalContext]

    const events =
        createAlbumTimeline(album, listenEvents)

    return (

        <section className="album-timeline">

            <div className="timeline-header">

                <h2>

                    {t.timeline.title}

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

                                        {event.roleAtTime&&<small>{t.journal.inferredRole(t.roles[event.roleAtTime].title)}</small>}
                                        {event.journal&&<div className="timeline-journal"><blockquote>{event.journal.note}</blockquote><div>{[...event.journal.moodTags,...event.journal.contextTags].map(tag=><span key={tag}>{journalTagLabel(tag)}</span>)}</div>{onEditJournal&&<button type="button" onClick={()=>onEditJournal(event.id)}>{t.journal.edit}</button>}</div>}

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
