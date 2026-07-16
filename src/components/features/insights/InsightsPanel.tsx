import type { Album } from "../../../types/album"

import {
    evaluateInsights,
} from "../../../domain/insights/evaluateInsights"
import { useI18n } from "../../../i18n/useI18n"

const insightTranslationKeys = {
    "building-library": "buildingLibrary",
    "discovery-phase": "discoveryPhase",
    "archive-heavy": "archiveHeavy",
    "comfort-heavy": "comfortHeavy",
    "classic-core": "classicCore",
} as const

type InsightsPanelProps = {

    albums: Album[]

}

function InsightsPanel({

    albums,

}: InsightsPanelProps) {
    const { t } = useI18n()

    const insights =
        evaluateInsights(albums)

    return (

        <section className="insights-panel">

            <div className="insights-header">

                <h2>

                    {t.dashboard.insights}

                </h2>

                <p>

                    {t.dashboard.subtitle}

                </p>

            </div>

            <div className="insights-list">

                {
                    insights.map(insight => (

                        <article
                            key={insight.code}
                            className={
                                insight.priority === "reflection"
                                    ? "insight-card reflection"
                                    : "insight-card"
                            }
                        >

                            <h3>

                                {t.insights[insightTranslationKeys[insight.code]].title}

                            </h3>

                            <p>

                                {t.insights[insightTranslationKeys[insight.code]].description}

                            </p>

                        </article>

                    ))
                }

            </div>

        </section>

    )

}

export default InsightsPanel
