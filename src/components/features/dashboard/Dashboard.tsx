import type { Album } from "../../../types/album"

import {
    type ReflectionPrompt,
} from "../../../domain/reflection/evaluateReflection"

import InsightsPanel from "../insights/InsightsPanel"
import ReflectionCard from "../reflection/ReflectionCard"
import RoleOverviewPanel from "../rotation-dashboard/RoleOverviewPanel"
import { useI18n } from "../../../i18n/useI18n"

type DashboardProps = {

    albums: Album[]

    reflectionPrompt?: ReflectionPrompt

    onReflect: () => void

}

function Dashboard({

    albums,

    reflectionPrompt,

    onReflect,

}: DashboardProps) {
    const { t } = useI18n()

    return (

        <section className="dashboard-shell">

            <div className="dashboard-header">

                <h2>

                    {t.dashboard.title}

                </h2>

                <p>

                    {t.dashboard.subtitle}

                </p>

            </div>

            <div className="dashboard-grid">

                <section className="dashboard-section question">

                    <p className="dashboard-section-label">

                        {t.dashboard.nextQuestion}

                    </p>

                    <ReflectionCard

                        prompt={reflectionPrompt}

                        onReflect={onReflect}

                    />

                </section>

                <section className="dashboard-section insights">

                    <InsightsPanel

                        albums={albums}

                    />

                </section>

                <section className="dashboard-section balance">

                    <p className="dashboard-section-label">

                        {t.dashboard.roleOverview}

                    </p>

                    <RoleOverviewPanel

                        albums={albums}

                    />

                </section>

            </div>

        </section>

    )

}

export default Dashboard
