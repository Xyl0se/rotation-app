import type { Album } from "../../../types/album"

import type { RoleId } from "../../../domain/roles"

import { roles } from "../../../domain/roles"

import AlbumCover from "../../ui/AlbumCover"
import Card from "../../ui/Card"

function getRoleLabelClass(roleId: RoleId | undefined): string {
    if (!roleId) return "album-role-label"
    return `album-role-label role-${roleId}`
}

function getRoleTitle(roleId: RoleId | undefined): string | undefined {
    if (!roleId) return undefined
    return roles.find(r => r.id === roleId)?.title
}

type AlbumCardProps = {
    album: Album
    isFocus: boolean
    onArchive: (id: string) => void
    onDelete: (id: string) => void
    onEdit: (id: string) => void
    onLogListen: (id: string) => void
    onReconsider: (id: string) => void
    onSetFocus: (id: string) => void
    showRoleLabel?: boolean
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

    showRoleLabel = true,

}: AlbumCardProps) {

    const isArchived =
        album.category === "archive"

    return (

        <Card>

            <div className="album-card-inner">

                <AlbumCover
                    coverUrl={album.coverUrl}
                    coverOverride={album.coverOverride}
                    albumId={album.id}
                    title={album.title}
                    alt={`Cover von ${album.title}`}
                    className="album-cover-small"
                />

                <div className="album-card-body">

                    <div className="album-card-meta">

                        {
                            isArchived && (

                                <span className="album-state">

                                    Archiv

                                </span>

                            )
                        }

                        {
                            showRoleLabel && album.category && !isArchived && (

                                <span className={getRoleLabelClass(album.category)}>

                                    {getRoleTitle(album.category)}

                                </span>

                            )
                        }

                        <h3>

                            {album.title}

                        </h3>

                        <p>

                            {album.artist}

                        </p>

                        <small>

                            {album.year}

                        </small>

                    </div>

                    <div className="album-card-actions">

                        <button

                            className="album-listen-button"

                            onClick={() => onLogListen(album.id)}

                            aria-label={`Erfassen, dass du ${album.title} gehört hast`}

                        >

                            Gehört

                        </button>

                        <span className="album-listen-summary">

                            {album.listenCount}x gehört

                        </span>

                    </div>

                </div>

                <div className="album-card-tools">

                    {
                        !isArchived && (

                            <button

                                className={
                                    isFocus
                                        ? "focus-button active"
                                        : "focus-button"
                                }

                                onClick={() => onSetFocus(album.id)}

                                aria-label="Fokus setzen"

                                title="Fokus setzen"

                            >

                                {isFocus ? "★" : "☆"}

                            </button>

                        )
                    }

                    <button

                        className="card-tool-button edit"

                        onClick={() => onEdit(album.id)}

                        aria-label="Album bearbeiten"

                        title="Album bearbeiten"

                    >

                        ✎

                    </button>

                    <button

                        className="archive-button"

                        onClick={() =>
                            isArchived
                                ? onReconsider(album.id)
                                : onArchive(album.id)
                        }

                        aria-label={
                            isArchived
                                ? "Wiederentdeckung prüfen"
                                : "Im Archiv ablegen"
                        }

                        title={
                            isArchived
                                ? "Wiederentdeckung prüfen"
                                : "Im Archiv ablegen"
                        }

                    >

                        {isArchived ? "↩" : "⬇"}

                    </button>

                    <button

                        className="card-tool-button delete"

                        onClick={() => onDelete(album.id)}

                        aria-label="Album löschen"

                        title="Album löschen"

                    >

                        ✕

                    </button>

                </div>

            </div>

        </Card>

    )

}

export default AlbumCard
