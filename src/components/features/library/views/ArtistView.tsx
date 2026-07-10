import type { Album } from "../../../../types/album"

import { groupByArtist } from "../../../../domain/library-views/groupByArtist"

import GroupedLibraryView from "./GroupedLibraryView"

type ArtistViewProps = {
    albums: Album[]
    focusAlbumId: string | null
    onArchive: (id: string) => void
    onDelete: (id: string) => void
    onEdit: (id: string) => void
    onLogListen: (id: string) => void
    onReconsider: (id: string) => void
    onSetFocus: (id: string) => void
}

function ArtistView({
    albums,
    focusAlbumId,
    onArchive,
    onDelete,
    onEdit,
    onLogListen,
    onReconsider,
    onSetFocus,
}: ArtistViewProps) {

    const groups = groupByArtist(albums)

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
            emptyMessage="Noch keine Alben in der Bibliothek."
        />
    )

}

export default ArtistView
