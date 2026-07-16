import type { Album } from "../../../types/album"

import type { RoleId } from "../../../domain/roles"

import { createRoleOverview } from "../../../domain/roles/roleOverview"

import { getRoleEmptyMessage } from "../../../domain/roles/roleEmptyMessages"

import { useI18n } from "../../../i18n/useI18n"
import AlbumCover from "../../ui/AlbumCover"

type RoleExplorerProps = {
    albums: Album[]
    onSelectRole: (roleId: RoleId) => void
}

function RoleExplorer({ albums, onSelectRole }: RoleExplorerProps) {
    const { t } = useI18n()

    const overviews = createRoleOverview(albums)

    return (
        <section className="role-explorer">

            <p className="role-explorer-intro">
                {t.roleExplorer.intro}
            </p>

            <div className="role-explorer-grid">

                {overviews.map(overview => (

                    <button
                        key={overview.role.id}
                        className="role-card"
                        onClick={() => onSelectRole(overview.role.id)}
                        aria-label={`${overview.role.title}: ${overview.albumCount} ${overview.albumCount === 1 ? t.common.album : t.common.albums}`}
                    >

                        <div className="role-card-header">
                            <span className="role-card-icon">
                                {overview.role.icon}
                            </span>
                            <div className="role-card-title-group">
                                <h3 className="role-card-title">
                                    {overview.role.title}
                                </h3>
                                <p className="role-card-count">
                                    {overview.albumCount} {overview.albumCount === 1 ? t.common.album : t.common.albums}
                                </p>
                            </div>
                        </div>

                        <p className="role-card-description">
                            {overview.role.description}
                        </p>

                        {overview.isEmpty ? (
                            <p className="role-card-empty">
                                {getRoleEmptyMessage(overview.role.id, t)}
                            </p>
                        ) : (
                            <div className="role-card-previews">
                                {overview.previewAlbums.map(album => (
                                    <AlbumCover key={album.id} albumId={album.id} coverUrl={album.coverUrl} coverOverride={album.coverOverride} title={album.title} alt={album.title} className="role-card-preview" />
                                ))}
                            </div>
                        )}

                    </button>

                ))}

            </div>

        </section>
    )

}

export default RoleExplorer
