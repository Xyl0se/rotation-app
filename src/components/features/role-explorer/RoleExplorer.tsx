import type { Album } from "../../../types/album"

import type { RoleId } from "../../../domain/roles"

import { createRoleOverview } from "../../../domain/roles/roleOverview"

import { getRoleEmptyMessage } from "../../../domain/roles/roleEmptyMessages"

type RoleExplorerProps = {
    albums: Album[]
    onSelectRole: (roleId: RoleId) => void
}

function RoleExplorer({ albums, onSelectRole }: RoleExplorerProps) {

    const overviews = createRoleOverview(albums)

    return (
        <section className="role-explorer">

            <p className="role-explorer-intro">
                Jede Rolle erzählt eine andere Geschichte über deine Sammlung.
            </p>

            <div className="role-explorer-grid">

                {overviews.map(overview => (

                    <button
                        key={overview.role.id}
                        className="role-card"
                        onClick={() => onSelectRole(overview.role.id)}
                        aria-label={`${overview.role.title}: ${overview.albumCount} ${overview.albumCount === 1 ? "Album" : "Alben"}`}
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
                                    {overview.albumCount} {overview.albumCount === 1 ? "Album" : "Alben"}
                                </p>
                            </div>
                        </div>

                        <p className="role-card-description">
                            {overview.role.description}
                        </p>

                        {overview.isEmpty ? (
                            <p className="role-card-empty">
                                {getRoleEmptyMessage(overview.role.id)}
                            </p>
                        ) : (
                            <div className="role-card-previews">
                                {overview.previewAlbums.map(album => (
                                    album.coverUrl ? (
                                        <img
                                            key={album.id}
                                            src={album.coverUrl}
                                            alt={album.title}
                                            className="role-card-preview"
                                            loading="lazy"
                                        />
                                    ) : (
                                        <div
                                            key={album.id}
                                            className="role-card-preview"
                                            style={{
                                                background: "var(--color-sand)",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                fontSize: "14px",
                                                color: "var(--color-smoke)",
                                            }}
                                        >
                                            {album.title.charAt(0)}
                                        </div>
                                    )
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
