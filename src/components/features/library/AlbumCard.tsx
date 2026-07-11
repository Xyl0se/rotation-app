import { useRef, useState, useEffect } from "react"

import type { Album } from "../../../types/album"

import AlbumCover from "../../ui/AlbumCover"
import { useI18n } from "../../../i18n/I18nContext"

type AlbumCardProps = {

    album: Album

    isFocus: boolean

    onArchive: (id: string) => void

    onDelete: (id: string) => void

    onEdit: (id: string) => void

    onLogListen: (id: string) => void

    onReconsider: (id: string) => void

    onSetFocus: (id: string) => void

}

function AlbumCard({

    album,

    isFocus,

    onArchive,

    onDelete,

    onEdit,

    onLogListen,

    onReconsider,

    onSetFocus,

}: AlbumCardProps) {
    const { t } = useI18n()

    const menuRef = useRef<HTMLDivElement>(null)

    const [menuOpen, setMenuOpen] = useState(false)

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target as Node)
            ) {
                setMenuOpen(false)
            }
        }

        if (menuOpen) {
            document.addEventListener("mousedown", handleClickOutside)
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [menuOpen])

    return (

        <div className={`album-card ${isFocus ? "focus" : ""}`}>

            <button
                className="album-card-cover-button"
                onClick={() => onSetFocus(album.id)}
                title={t.albumCard.setFocus}
            >
                <AlbumCover
                    coverUrl={album.coverUrl}
                    coverOverride={album.coverOverride}
                    albumId={album.id}
                    title={album.title}
                    alt={album.title}
                    className="album-cover library-cover"
                />
            </button>

            <div className="album-card-info">

                <h4>
                    {album.title}
                </h4>

                <p>
                    {album.artist}
                </p>

                <div className="album-card-meta">
                    <span>
                        {album.year || "—"}
                    </span>
                    <span>
                        {t.albumCard.listenCount(album.listenCount)}
                    </span>
                </div>

                <div className="album-card-actions">
                    <button
                        className="listen-button"
                        onClick={() => onLogListen(album.id)}
                    >
                        {t.albumCard.listened}
                    </button>
                    <div className="action-menu" ref={menuRef}>
                        <button
                            className="action-menu-toggle"
                            onClick={() => setMenuOpen(!menuOpen)}
                            aria-label="Open Action Menu"
                            aria-expanded={menuOpen}
                        >
                            ⋮
                        </button>
                        {menuOpen && (
                            <div className="action-menu-dropdown">
                                <button
                                    className="menu-item"
                                    onClick={() => {
                                        onEdit(album.id)
                                        setMenuOpen(false)
                                    }}
                                >
                                    {t.albumCard.edit}
                                </button>
                                {album.category === "archive" ? (
                                    <button
                                        className="menu-item"
                                        onClick={() => {
                                            onReconsider(album.id)
                                            setMenuOpen(false)
                                        }}
                                    >
                                        {t.albumCard.reconsider}
                                    </button>
                                ) : (
                                    <button
                                        className="menu-item"
                                        onClick={() => {
                                            onArchive(album.id)
                                            setMenuOpen(false)
                                        }}
                                    >
                                        {t.albumCard.archive}
                                    </button>
                                )}
                                <button
                                    className="menu-item danger"
                                    onClick={() => {
                                        onDelete(album.id)
                                        setMenuOpen(false)
                                    }}
                                >
                                    {t.albumCard.delete}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

            </div>

        </div>

    )

}

export default AlbumCard
