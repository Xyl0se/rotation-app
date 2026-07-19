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

const ALBUMS_PER_PAGE = 10

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
    onOpenDetail?: (id: string) => void
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
    onOpenDetail,

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
    const [page, setPage] = useState(1)
    const searchRef = useRef<HTMLInputElement>(null)
    const filteredAlbums = useMemo(
        () => filterLibraryAlbums(albums, filters, listenEvents).sort((a, b) => {
            if (a.createdAt && b.createdAt) return b.createdAt.localeCompare(a.createdAt)
            if (a.createdAt) return -1
            if (b.createdAt) return 1
            return albums.indexOf(a) - albums.indexOf(b)
        }),
        [albums, filters, listenEvents],
    )
    const pageCount = Math.max(1, Math.ceil(filteredAlbums.length / ALBUMS_PER_PAGE))
    const effectivePage = Math.min(page, pageCount)
    const visibleAlbums = filteredAlbums.slice(
        (effectivePage - 1) * ALBUMS_PER_PAGE,
        effectivePage * ALBUMS_PER_PAGE,
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
        setPage(1)
    }

    function handleBack() {
        setSelectedRole(null)
        setPage(1)
    }

    function handleViewChange(mode: MainViewMode) {
        setViewMode(mode)
        setSelectedRole(null)
        setPage(1)
    }

    function handlePerspectiveChange(mode: PerspectiveMode) {
        setPerspectiveMode(mode)
        setPage(1)
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
                onChange={(nextFilters) => {
                    setFilters(nextFilters)
                    setPage(1)
                }}
                onReset={() => {
                    setFilters(emptyLibraryFilters)
                    setPage(1)
                }}
                resultCount={filteredAlbums.length}
                totalCount={albums.length}
                searchRef={searchRef}
            />

            {filteredAlbums.length === 0 && (
                <div className="library-filter-empty" role="status">
                    <p>{t.library.controls.noResults}</p>
                    {hasActiveLibraryFilters(filters) && (
                        <button type="button" onClick={() => {
                            setFilters(emptyLibraryFilters)
                            setPage(1)
                        }}>
                            {t.library.controls.reset}
                        </button>
                    )}
                </div>
            )}

            {viewMode === "all" && filteredAlbums.length > 0 && (

                <div className="library-grid">

                    {

                        visibleAlbums.map(album => (

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
                                onOpenDetail={onOpenDetail}

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
                    onOpenDetail={onOpenDetail}
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
                    onOpenDetail={onOpenDetail}
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
                    onOpenDetail={onOpenDetail}
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
                    onOpenDetail={onOpenDetail}
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
                    onOpenDetail={onOpenDetail}
                />
            )}

            {viewMode === "all" && filteredAlbums.length > ALBUMS_PER_PAGE && (
                <nav className="library-pagination" aria-label={t.library.pagination.label}>
                    <button type="button" disabled={effectivePage === 1} onClick={() => setPage(current => current - 1)}>
                        {t.library.pagination.previous}
                    </button>
                    <span>{t.library.pagination.status(effectivePage, pageCount)}</span>
                    <button type="button" disabled={effectivePage === pageCount} onClick={() => setPage(current => current + 1)}>
                        {t.library.pagination.next}
                    </button>
                </nav>
            )}

        </section>

    )

}

export default Library
