import Button from "../../ui/Button"
import { useI18n } from "../../../i18n/useI18n"
import type { InsightBuildingArea,InsightCode,InsightMetric,InsightsResponse } from "../../../services/api/insightsService"

const codeKeys:Record<InsightCode,keyof ReturnType<typeof useI18n>["t"]["insights"]["narratives"]>={
    "discovery-rising":"discoveryRising","familiarity-rising":"familiarityRising","listening-balanced":"listeningBalanced","dormant-library":"dormantLibrary","rediscovery-moments":"rediscoveryMoments","roles-in-motion":"rolesInMotion","rotation-evolving":"rotationEvolving",
}
const metricKeys:Record<InsightMetric,keyof ReturnType<typeof useI18n>["t"]["insights"]["evidence"]>={
    "recent-listens":"recentListens","previous-listens":"previousListens","recent-discovery-listens":"recentDiscoveryListens","previous-discovery-listens":"previousDiscoveryListens","recent-familiar-listens":"recentFamiliarListens","previous-familiar-listens":"previousFamiliarListens","dormant-albums":"dormantAlbums","library-albums":"libraryAlbums","rediscovered-listens":"rediscoveredListens","recent-role-transitions":"recentRoleTransitions","rotation-entering":"rotationEntering","rotation-leaving":"rotationLeaving","rotation-unchanged":"rotationUnchanged",
}
const buildingKeys:Record<InsightBuildingArea,keyof ReturnType<typeof useI18n>["t"]["insights"]["building"]>={library:"library", "listening-comparison":"listeningComparison", "rotation-comparison":"rotationComparison"}

export default function InsightsPanel({data,isLoading,error,onRetry}:{data:InsightsResponse|null;isLoading:boolean;error:string|null;onRetry:()=>void}) {
    const {t,language}=useI18n()
    const formatDate=(value:string)=>new Intl.DateTimeFormat(language,{dateStyle:"medium"}).format(new Date(value))
    return <section className="insights-panel" aria-labelledby="narratives-heading">
        <div className="insights-header"><div><h2 id="narratives-heading">{t.dashboard.insights}</h2><p>{t.insights.editorialIntro}</p></div></div>
        {isLoading&&<div className="insights-building" role="status">{t.insights.loading}</div>}
        {!isLoading&&error&&<div className="sync-status sync-status--warning" role="status"><span>{t.insights.unavailable}</span><Button variant="secondary" onClick={onRetry}>{t.insights.retry}</Button></div>}
        {!isLoading&&!error&&data&&<>
            <div className="insights-list">{data.insights.map(insight=>{const copy=t.insights.narratives[codeKeys[insight.code]];return <article key={insight.code} className="insight-card">
                <span className="insight-card-level">{insight.evidenceLevel==="strong"?t.insights.strongEvidence:t.insights.supportedEvidence}</span><h3>{copy.title}</h3><p>{copy.description}</p>
                {insight.period&&<p className="insight-period">{formatDate(insight.period.from)} – {formatDate(insight.period.to)}</p>}
                <details><summary>{t.insights.why}</summary><ul>{insight.evidence.map(item=><li key={item.metric}>{t.insights.evidence[metricKeys[item.metric]].replace("{count}",String(item.value))}</li>)}</ul><code>{insight.code}</code></details>
            </article>})}</div>
            {data.insights.length===0&&data.buildingAreas[0]&&<div className="insights-building"><h3>{t.insights.building[buildingKeys[data.buildingAreas[0]]].title}</h3><p>{t.insights.building[buildingKeys[data.buildingAreas[0]]].description}</p></div>}
        </>}
    </section>
}
