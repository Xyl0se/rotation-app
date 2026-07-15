import { useState, useMemo } from "react"

import type { Album } from "../../../types/album"

import type { ListenEvent } from "../../../domain/listening/listenEvents"

import type { RoleId } from "../../../domain/roles"

import AlbumCard from "./AlbumCard"
import LibraryViewSwitcher from "./LibraryViewSwitcher"
import RoleExplorer from "../role-explorer/RoleExplorer"
import RoleDetail from "../role-explorer/RoleDetail"
import ArtistView from "./views/ArtistView"
import YearView from "./views/YearView"
import LastListenedView from "./views/LastListenedView"
import RoleChangeView from "./views/RoleChangeView"

import type { MainViewMode, PerspectiveMode } from "./LibraryViewSwitcher"
import { useI18n } from "../../../i18n/useI18n"
import { useBindings } from "../../../hooks/useBindings"
import type { Binding } from "../../../services/api/bindingsService"

type LibraryProps = {
    albums: Album[]
    listenEvents?: ListenEvent[]
    focusAlbumId: string | null
    highlightAlbumId?: string | null
    onArchive: (id: string) => void
    onDelete: (id: string) => void
    onEdit: (id: string) => void
    onLogListen: (id: string) => void
    onReconsider: (id: string) => void
    onSetFocus: (id: string) => void
}

function Library({

    albums,

    listenEvents = [],

    focusAlbumId,

    highlightAlbumId,

    onArchive,

    onDelete,

    onEdit,

    onLogListen,

    onReconsider,

    onSetFocus,

}: LibraryProps) {
    const { t } = useI18n()
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

    const [viewMode, setViewMode] = useState<MainViewMode>("all")

    const [perspectiveMode, setPerspectiveMode] =
        useState<PerspectiveMode>("artist")

    const [selectedRole, setSelectedRole] = useState<RoleId | null>(null)

    function handleSelectRole(roleId: RoleId) {
        setSelectedRole(roleId)
    }

    function handleBack() {
        setSelectedRole(null)
    }

    function handleViewChange(mode: MainViewMode) {
        setViewMode(mode)
        setSelectedRole(null)
    }

    function handlePerspectiveChange(mode: PerspectiveMode) {
        setPerspectiveMode(mode)
    }

    return (

        <section>

            <div className="library-header">

                <h2>{t.library.title}</h2>

                <LibraryViewSwitcher
                    viewMode={viewMode}
                    perspectiveMode={perspectiveMode}
                    onChange={handleViewChange}
                    onPerspectiveChange={handlePerspectiveChange}
                />

            </div>

            {viewMode === "all" && (

                <div className="library-grid">

                    {

                        albums.map(album => (

                            <AlbumCard

                                key={album.id}

                                album={album}

                                isFocus={album.id === focusAlbumId}

                                isHighlighted={album.id === highlightAlbumId}

                                binding={bindingMap.get(album.id) ?? null}

                                onArchive={onArchive}

                                onDelete={onDelete}

                                onEdit={onEdit}

                                onLogListen={onLogListen}

                                onReconsider={onReconsider}

                                onSetFocus={onSetFocus}

                            />

                        ))

                    }

                </div>

            )}

            {viewMode === "roles" && !selectedRole && (
                <RoleExplorer
                    albums={albums}
                    onSelectRole={handleSelectRole}
                />
            )}

            {viewMode === "roles" && selectedRole && (
                <RoleDetail
                    roleId={selectedRole}
                    albums={albums}
                    focusAlbumId={focusAlbumId}
                    onArchive={onArchive}
                    onDelete={onDelete}
                    onEdit={onEdit}
                    onLogListen={onLogListen}
                    onReconsider={onReconsider}
                    onSetFocus={onSetFocus}
                    onBack={handleBack}
                />
            )}

            {viewMode === "perspectives" && perspectiveMode === "artist" && (
                <ArtistView
                    albums={albums}
                    focusAlbumId={focusAlbumId}
                    onArchive={onArchive}
                    onDelete={onDelete}
                    onEdit={onEdit}
                    onLogListen={onLogListen}
                    onReconsider={onReconsider}
                    onSetFocus={onSetFocus}
                />
            )}

            {viewMode === "perspectives" && perspectiveMode === "year" && (
                <YearView
                    albums={albums}
                    focusAlbumId={focusAlbumId}
                    onArchive={onArchive}
                    onDelete={onDelete}
                    onEdit={onEdit}
                    onLogListen={onLogListen}
                    onReconsider={onReconsider}
                    onSetFocus={onSetFocus}
                />
            )}

            {viewMode === "perspectives" && perspectiveMode === "lastListened" && (
                <LastListenedView
                    albums={albums}
                    listenEvents={listenEvents}
                    focusAlbumId={focusAlbumId}
                    onArchive={onArchive}
                    onDelete={onDelete}
                    onEdit={onEdit}
                    onLogListen={onLogListen}
                    onReconsider={onReconsider}
                    onSetFocus={onSetFocus}
                />
            )}

            {viewMode === "perspectives" && perspectiveMode === "roleChange" && (
                <RoleChangeView
                    albums={albums}
                    focusAlbumId={focusAlbumId}
                    onArchive={onArchive}
                    onDelete={onDelete}
                    onEdit={onEdit}
                    onLogListen={onLogListen}
                    onReconsider={onReconsider}
                    onSetFocus={onSetFocus}
                />
            )}

        </section>

    )

}

export default Library
