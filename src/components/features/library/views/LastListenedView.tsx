import type { Album } from "../../../../types/album"
import type { ListenEvent } from "../../../../domain/listening/listenEvents"

import { groupByLastListened } from "../../../../domain/library-views/groupByLastListened"

import GroupedLibraryView from "./GroupedLibraryView"

type LastListenedViewProps = {
    albums: Album[]
    listenEvents: ListenEvent[]
    focusAlbumId: string | null
    onArchive: (id: string) => void
    onDelete: (id: string) => void
    onEdit: (id: string) => void
    onLogListen: (id: string) => void
    onReconsider: (id: string) => void
    onSetFocus: (id: string) => void
    onStartCoach: (id: string) => void
}

function LastListenedView({
    albums,
    listenEvents,
    focusAlbumId,
    onArchive,
    onDelete,
    onEdit,
    onLogListen,
    onReconsider,
    onSetFocus,
    onStartCoach,
}: LastListenedViewProps) {

    const groups = groupByLastListened(albums, listenEvents)

    return (
        <GroupedLibraryView
            groups={groups}
            focusAlbumId={focusAlbumId}
            onArchive={onArchive}
            onDelete={onDelete}
            onEdit={onEdit}
            onLogListen={onLogListen}
            onReconsider={onReconsider}
            onSetFocus={onSetFocus}
            onStartCoach={onStartCoach}
            emptyMessage="Noch keine Alben in der Bibliothek."
        />
    )

}

export default LastListenedView
