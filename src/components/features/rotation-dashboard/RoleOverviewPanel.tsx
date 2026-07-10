import type { Album } from "../../../types/album"

import RotationOverview from "./RotationOverview"

type RoleOverviewPanelProps = {

    albums: Album[]

}

function RoleOverviewPanel({

    albums,

}: RoleOverviewPanelProps) {

    return (

        <section className="role-overview-panel">

            <RotationOverview

                albums={albums}

            />

        </section>

    )

}

export default RoleOverviewPanel
