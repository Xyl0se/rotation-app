import type { Album } from "../../../../types/album"

import { groupByRoleChange } from "../../../../domain/library-views/groupByRoleChange"

import GroupedLibraryView from "./GroupedLibraryView"

type RoleChangeViewProps = {
    albums: Album[]
    focusAlbumId: string | null
    onArchive: (id: string) => void
    onDelete: (id: string) => void
    onEdit: (id: string) => void
    onLogListen: (id: string) => void
    onReconsider: (id: string) => void
    onSetFocus: (id: string) => void
}

function RoleChangeView({
    albums,
    focusAlbumId,
    onArchive,
    onDelete,
    onEdit,
    onLogListen,
    onReconsider,
    onSetFocus,
}: RoleChangeViewProps) {

    const groups = groupByRoleChange(albums)

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

export default RoleChangeView
