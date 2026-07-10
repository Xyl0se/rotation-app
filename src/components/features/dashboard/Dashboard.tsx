import type { Album } from "../../../types/album"

import {
    type ReflectionPrompt,
} from "../../../domain/reflection/evaluateReflection"

import InsightsPanel from "../insights/InsightsPanel"
import ReflectionCard from "../reflection/ReflectionCard"
import RoleOverviewPanel from "../rotation-dashboard/RoleOverviewPanel"

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

    return (

        <section className="dashboard-shell">

            <div className="dashboard-header">

                <h2>

                    Dashboard

                </h2>

                <p>

                    Was gerade Aufmerksamkeit verdient.

                </p>

            </div>

            <div className="dashboard-grid">

                <section className="dashboard-section question">

                    <p className="dashboard-section-label">

                        Nächste Frage

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

                        Rollenübersicht

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
