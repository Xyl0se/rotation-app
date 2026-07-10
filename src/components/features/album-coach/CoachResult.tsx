import { explainRole } from "../../../domain/album/explainRole"

import {
    roles,
    type RoleId,
} from "../../../domain/roles"

type CoachResultProps = {

    albumTitle: string

    role: RoleId

    onAccept: () => void

}

function CoachResult({

    albumTitle,

    role,

    onAccept,

}: CoachResultProps) {

    const roleDefinition =
        roles.find(r => r.id === role)

    return (

        <section className="coach-result">

            <p className="coach-album-title">

                {albumTitle}

            </p>

            <h2>

                Unsere Empfehlung

            </h2>

            <h1>

                {roleDefinition?.icon} {roleDefinition?.title}

            </h1>

            <p>

                {explainRole(role)}

            </p>

            <button

                onClick={onAccept}

            >

                Rolle übernehmen

            </button>

        </section>

    )

}

export default CoachResult