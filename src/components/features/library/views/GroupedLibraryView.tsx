import { useMemo } from "react"

import type { Album } from "../../../../types/album"

import type { LibraryGroup } from "../../../../domain/library-views/libraryGroup"

import AlbumCard from "../AlbumCard"
import { useBindings } from "../../../../hooks/useBindings"
import type { Binding } from "../../../../services/api/bindingsService"

type GroupedLibraryViewProps = {
    groups: LibraryGroup[]
    focusAlbumId: string | null
    onArchive: (id: string) => void
    onDelete: (id: string) => void
    onEdit: (id: string) => void
    onLogListen: (id: string) => void
    onReconsider: (id: string) => void
    onSetFocus: (id: string) => void
    emptyMessage?: string
}

function GroupedLibraryView({
    groups,
    focusAlbumId,
    onArchive,
    onDelete,
    onEdit,
    onLogListen,
    onReconsider,
    onSetFocus,
    emptyMessage = "In dieser Ansicht sind noch keine Alben sichtbar.",
}: GroupedLibraryViewProps) {
    const { bindings } = useBindings()

    const bindingMap = useMemo(() => {
        const map = new Map<string, Binding>()
        for (const b of bindings) {
            if (b.libraryAlbumId) {
                map.set(b.libraryAlbumId, b)
            }
        }
        return map
    }, [bindings])


    if (groups.length === 0) {
        return (
            <p className="library-empty-message">
                {emptyMessage}
            </p>
        )
    }

    return (
        <div className="grouped-library-view">
            {groups.map(group => (
                <section
                    key={group.key}
                    className="library-group"
                >
                    <header className="library-group-header">
                        <h3 className="library-group-title">
                            {group.title}
                        </h3>
                        {group.description && (
                            <p className="library-group-description">
                                {group.description}
                            </p>
                        )}
                    </header>

                    <div className="library-grid">
                        {group.albums.map((album: Album) => (
                            <AlbumCard
                                key={album.id}
                                album={album}
                                isFocus={album.id === focusAlbumId}
                                binding={bindingMap.get(album.id) ?? null}
                                onArchive={onArchive}
                                onDelete={onDelete}
                                onEdit={onEdit}
                                onLogListen={onLogListen}
                                onReconsider={onReconsider}
                                onSetFocus={onSetFocus}
                            />
                        ))}
                    </div>
                </section>
            ))}
        </div>
    )

}

export default GroupedLibraryView
