import { explainRole } from "../../../domain/album/explainRole"

import {
    roles,
    type RoleId,
} from "../../../domain/roles"

import { useI18n } from "../../../i18n/useI18n"

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
    const { t } = useI18n()

    const roleDefinition =
        roles.find(r => r.id === role)

    return (

        <section className="album-coach coach-result">

            <p className="coach-album-title">

                {albumTitle}

            </p>

            <h2>

                {t.coach.result.ourRecommendation}

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

                {t.coach.result.accept}

            </button>

        </section>

    )

}

export default CoachResult
