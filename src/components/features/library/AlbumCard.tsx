import type { Album } from "../../../types/album"

import type { RoleId } from "../../../domain/roles"

import type { Binding } from "../../../services/api/bindingsService"

import AlbumCover from "../../ui/AlbumCover"
import Card from "../../ui/Card"
import { useI18n } from "../../../i18n/useI18n"

function getRoleLabelClass(roleId: RoleId | undefined): string {
    if (!roleId) return "album-role-label"
    return `album-role-label role-${roleId}`
}

type AlbumCardProps = {
    album: Album
    isFocus: boolean
    isHighlighted?: boolean
    onArchive: (id: string) => void
    onDelete: (id: string) => void
    onEdit: (id: string) => void
    onLogListen: (id: string) => void
    onReconsider: (id: string) => void
    onSetFocus: (id: string) => void
    onStartCoach?: (id: string) => void
    showRoleLabel?: boolean
    binding?: Binding | null
    id?: string
}

function AlbumCard({
    album,
    isHighlighted = false,
    onArchive,
    onDelete,
    onEdit,
    onLogListen,
    onReconsider,
    onStartCoach,
    showRoleLabel = true,
    binding = null,
    id,
}: AlbumCardProps) {
    const { t } = useI18n()

    const isArchived = album.category === "archive"

    function getRoleTitle(roleId: RoleId | undefined): string | undefined {
        if (!roleId) return undefined
        const roleKey = roleId as keyof typeof t.roles
        return t.roles[roleKey]?.title
    }

    const isBound = binding !== undefined && binding !== null && binding.state === "confirmed"
    const isMissing = isBound && !binding.folderExists

    return (
        <Card className={isHighlighted ? "album-card--highlighted" : undefined} id={id}>
            <div className="album-card-inner">
                <AlbumCover
                    coverUrl={album.coverUrl}
                    coverOverride={album.coverOverride}
                    albumId={album.id}
                    title={album.title}
                    alt={t.common.coverOf(album.title)}
                    className="album-cover-small"
                />

                <div className="album-card-body">
                    <div className="album-card-meta">
                        {isArchived && (
                            <span className="album-state">
                                {t.albumCard.archiveLabel}
                            </span>
                        )}

                        {showRoleLabel && album.category && !isArchived && (
                            <span className={getRoleLabelClass(album.category)}>
                                {getRoleTitle(album.category)}
                            </span>
                        )}

                        <h3>{album.title}</h3>

                        <p>{album.artist}</p>

                        <small>{album.year}</small>

                        <span
                            className={`album-binding-badge ${isBound ? "bound" : "unbound"} ${isMissing ? "missing" : ""}`}
                            title={
                                isMissing && binding
                                    ? t.albumCard.missingFolderTooltip(binding.relativePath)
                                    : isBound && binding
                                        ? t.albumCard.boundTooltip(binding.relativePath)
                                        : undefined
                            }
                        >
                            {isMissing
                                ? t.albumCard.unbound
                                : isBound
                                    ? t.albumCard.bound
                                    : t.albumCard.unbound}
                        </span>
                    </div>

                    <div className="album-card-actions">
                        <button
                            className="album-listen-button"
                            onClick={() => onLogListen(album.id)}
                            aria-label={`${t.albumCard.listened}: ${album.title}`}
                        >
                            {t.albumCard.listened}
                        </button>

                        <span className="album-listen-summary">
                            {t.albumCard.listenCount(album.listenCount)}
                        </span>
                    </div>
                </div>

                <div className="album-card-tools">
                    {!album.category && onStartCoach && (
                        <button
                            className="card-tool-button coach"
                            onClick={() => onStartCoach(album.id)}
                            aria-label={t.albumCard.startCoach}
                            title={t.albumCard.startCoach}
                        >
                            ✨
                        </button>
                    )}

                    <button
                        className="card-tool-button edit"
                        onClick={() => onEdit(album.id)}
                        aria-label={t.albumCard.edit}
                        title={t.albumCard.edit}
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
                                ? t.albumCard.reconsider
                                : t.albumCard.archive
                        }
                        title={
                            isArchived
                                ? t.albumCard.reconsider
                                : t.albumCard.archive
                        }
                    >
                        {isArchived ? "↩" : "⬇"}
                    </button>

                    <button
                        className="card-tool-button delete"
                        onClick={() => onDelete(album.id)}
                        aria-label={t.albumCard.delete}
                        title={t.albumCard.delete}
                    >
                        ✕
                    </button>
                </div>
            </div>
        </Card>
    )
}

export default AlbumCard
