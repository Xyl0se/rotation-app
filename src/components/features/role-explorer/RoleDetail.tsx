import type { Album } from "../../../types/album"

import type { RoleId } from "../../../domain/roles"

import { roles } from "../../../domain/roles"

import { getAlbumsByRole } from "../../../domain/roles/roleOverview"

import { getRoleEmptyMessage } from "../../../domain/roles/roleEmptyMessages"

import AlbumCard from "../library/AlbumCard"

import { useI18n } from "../../../i18n/useI18n"

type RoleDetailProps = {
    roleId: RoleId
    albums: Album[]
    focusAlbumId: string | null
    onArchive: (id: string) => void
    onDelete: (id: string) => void
    onEdit: (id: string) => void
    onLogListen: (id: string) => void
    onReconsider: (id: string) => void
    onSetFocus: (id: string) => void
    onBack: () => void
}

function RoleDetail({
    roleId,
    albums,
    focusAlbumId,
    onArchive,
    onDelete,
    onEdit,
    onLogListen,
    onReconsider,
    onSetFocus,
    onBack,
}: RoleDetailProps) {
    const { t } = useI18n()

    const role = roles.find(r => r.id === roleId)

    if (!role) return null

    const roleAlbums = getAlbumsByRole(albums, roleId)

    return (
        <section className="role-detail">

            <button
                className="role-detail-back"
                onClick={onBack}
                aria-label={t.roleExplorer.backToOverviewAria}
            >
                {t.roleExplorer.backToOverview}
            </button>

            <header className="role-detail-header">
                <span className="role-detail-icon">
                    {role.icon}
                </span>
                <div className="role-detail-title-group">
                    <h2 className="role-detail-title">
                        {role.title}
                    </h2>
                    <p className="role-detail-count">
                        {roleAlbums.length} {roleAlbums.length === 1 ? t.common.album : t.common.albums}
                    </p>
                </div>
            </header>

            <p className="role-detail-description">
                {role.description}
            </p>

            <div className="role-detail-future">
                <p>
                    {t.roleExplorer.futureInsights}
                </p>
            </div>

            {roleAlbums.length === 0 ? (
                <div className="role-detail-empty">
                    <p>{getRoleEmptyMessage(roleId, t)}</p>
                </div>
            ) : (
                <div className="role-detail-grid">
                    {roleAlbums.map(album => (
                        <AlbumCard
                            key={album.id}
                            album={album}
                            isFocus={album.id === focusAlbumId}
                            onArchive={onArchive}
                            onDelete={onDelete}
                            onEdit={onEdit}
                            onLogListen={onLogListen}
                            onReconsider={onReconsider}
                            onSetFocus={onSetFocus}
                        />
                    ))}
                </div>
            )}

        </section>
    )

}

export default RoleDetail
