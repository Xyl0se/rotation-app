import type { Album } from "../../../types/album"

import {
    evaluateInsights,
} from "../../../domain/insights/evaluateInsights"

type InsightsPanelProps = {

    albums: Album[]

}

function InsightsPanel({

    albums,

}: InsightsPanelProps) {

    const insights =
        evaluateInsights(albums)

    return (

        <section className="insights-panel">

            <div className="insights-header">

                <h2>

                    Insights

                </h2>

                <p>

                    Was deine Sammlung gerade erzählt.

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

                                {insight.title}

                            </h3>

                            <p>

                                {insight.description}

                            </p>

                        </article>

                    ))
                }

            </div>

        </section>

    )

}

export default InsightsPanel
