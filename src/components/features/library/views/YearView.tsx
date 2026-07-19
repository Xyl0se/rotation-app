import type { Album } from "../../../../types/album"

import { groupByYear } from "../../../../domain/library-views/groupByYear"

import GroupedLibraryView from "./GroupedLibraryView"

type YearViewProps = {
    albums: Album[]
    focusAlbumId: string | null
    onArchive: (id: string) => void
    onDelete: (id: string) => void
    onEdit: (id: string) => void
    onLogListen: (id: string) => void
    onReconsider: (id: string) => void
    onSetFocus: (id: string) => void
    onStartCoach: (id: string) => void
    onOpenDetail?: (id: string) => void
}

function YearView({
    albums,
    focusAlbumId,
    onArchive,
    onDelete,
    onEdit,
    onLogListen,
    onReconsider,
    onSetFocus,
    onStartCoach,
    onOpenDetail,
}: YearViewProps) {

    const groups = groupByYear(albums)

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
            onOpenDetail={onOpenDetail}
            emptyMessage="Noch keine Alben in der Bibliothek."
        />
    )

}

export default YearView
