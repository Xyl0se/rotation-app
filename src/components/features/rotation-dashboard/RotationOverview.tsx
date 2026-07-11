import type { Album } from "../../../types/album"

import {
    createRoleOverview,
} from "../../../domain/roles/roleOverview"

import { useI18n } from "../../../i18n/useI18n"

type RotationOverviewProps = {

    albums: Album[]

}

function RotationOverview({

    albums,

}: RotationOverviewProps) {
    const { t } = useI18n()

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

                                    ? t.common.album

                                    : t.common.albums

                            }

                        </p>

                    </article>

                ))

            }

        </section>

    )

}

export default RotationOverview
