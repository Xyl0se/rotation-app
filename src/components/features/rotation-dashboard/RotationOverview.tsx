import type { Album } from "../../../types/album"

import {
    createRoleOverview,
} from "../../../domain/roles/roleOverview"

type RotationOverviewProps = {

    albums: Album[]

}

function RotationOverview({

    albums,

}: RotationOverviewProps) {

    const overview =
        createRoleOverview(albums)

    return (

        <section className="rotation-overview">

            {

                overview.map(entry => (

                    <article

                        key={entry.role.id}

                        className="rotation-overview-card"

                    >

                        <h3>

                            {entry.role.icon} {entry.role.title}

                        </h3>

                        <p>

                            {entry.albumCount}{" "}

                            {

                                entry.albumCount === 1

                                    ? "Album"

                                    : "Alben"

                            }

                        </p>

                    </article>

                ))

            }

        </section>

    )

}

export default RotationOverview
