import { useState, useMemo, useEffect, useRef } from "react"

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
import LibraryControls from "./LibraryControls"
import {
    emptyLibraryFilters,
    filterLibraryAlbums,
    hasActiveLibraryFilters,
    type LibraryFilters,
} from "../../../domain/library-search/libraryFilters"

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
    onStartCoach: (id: string) => void
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
    onStartCoach,

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
    const [filters, setFilters] = useState<LibraryFilters>(emptyLibraryFilters)
    const searchRef = useRef<HTMLInputElement>(null)
    const filteredAlbums = useMemo(
        () => filterLibraryAlbums(albums, filters, listenEvents),
        [albums, filters, listenEvents],
    )

    useEffect(() => {
        function focusSearch(event: KeyboardEvent) {
            const target = event.target
            const isEditing = target instanceof Element
                && target.matches("input, textarea, select, [contenteditable='true']")
            if (event.key === "/" && !isEditing) {
                event.preventDefault()
                searchRef.current?.focus()
            }
        }
        document.addEventListener("keydown", focusSearch)
        return () => document.removeEventListener("keydown", focusSearch)
    }, [])

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

            <LibraryControls
                filters={filters}
                onChange={setFilters}
                onReset={() => setFilters(emptyLibraryFilters)}
                resultCount={filteredAlbums.length}
                totalCount={albums.length}
                searchRef={searchRef}
            />

            {filteredAlbums.length === 0 && (
                <div className="library-filter-empty" role="status">
                    <p>{t.library.controls.noResults}</p>
                    {hasActiveLibraryFilters(filters) && (
                        <button type="button" onClick={() => setFilters(emptyLibraryFilters)}>
                            {t.library.controls.reset}
                        </button>
                    )}
                </div>
            )}

            {viewMode === "all" && filteredAlbums.length > 0 && (

                <div className="library-grid">

                    {

                        filteredAlbums.map(album => (

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
                                onStartCoach={onStartCoach}

                            />

                        ))

                    }

                </div>

            )}

            {viewMode === "roles" && !selectedRole && (
                <RoleExplorer
                    albums={filteredAlbums}
                    onSelectRole={handleSelectRole}
                />
            )}

            {viewMode === "roles" && selectedRole && (
                <RoleDetail
                    roleId={selectedRole}
                    albums={filteredAlbums}
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
                    albums={filteredAlbums}
                    focusAlbumId={focusAlbumId}
                    onArchive={onArchive}
                    onDelete={onDelete}
                    onEdit={onEdit}
                    onLogListen={onLogListen}
                    onReconsider={onReconsider}
                    onSetFocus={onSetFocus}
                    onStartCoach={onStartCoach}
                />
            )}

            {viewMode === "perspectives" && perspectiveMode === "year" && (
                <YearView
                    albums={filteredAlbums}
                    focusAlbumId={focusAlbumId}
                    onArchive={onArchive}
                    onDelete={onDelete}
                    onEdit={onEdit}
                    onLogListen={onLogListen}
                    onReconsider={onReconsider}
                    onSetFocus={onSetFocus}
                    onStartCoach={onStartCoach}
                />
            )}

            {viewMode === "perspectives" && perspectiveMode === "lastListened" && (
                <LastListenedView
                    albums={filteredAlbums}
                    listenEvents={listenEvents}
                    focusAlbumId={focusAlbumId}
                    onArchive={onArchive}
                    onDelete={onDelete}
                    onEdit={onEdit}
                    onLogListen={onLogListen}
                    onReconsider={onReconsider}
                    onSetFocus={onSetFocus}
                    onStartCoach={onStartCoach}
                />
            )}

            {viewMode === "perspectives" && perspectiveMode === "roleChange" && (
                <RoleChangeView
                    albums={filteredAlbums}
                    focusAlbumId={focusAlbumId}
                    onArchive={onArchive}
                    onDelete={onDelete}
                    onEdit={onEdit}
                    onLogListen={onLogListen}
                    onReconsider={onReconsider}
                    onSetFocus={onSetFocus}
                    onStartCoach={onStartCoach}
                />
            )}

        </section>

    )

}

export default Library
