import type { Insight, InsightsResponse } from "../domain/insightTypes.js"
import type { InsightEvidenceRepository } from "../infrastructure/persistence/sqlite/insightEvidenceRepository.js"

const DAY=86_400_000
const ratio=(part:number,total:number)=>total?part/total:0
const iso=(value:number)=>new Date(value).toISOString()

export function createInsightsService(repository:InsightEvidenceRepository) {
    return {
        evaluate(now=new Date()):InsightsResponse {
            const nowMs=now.getTime(),currentFrom=iso(nowMs-90*DAY),previousFrom=iso(nowMs-180*DAY),to=now.toISOString()
            const roles=repository.roleOverview(),libraryTotal=Object.values(roles).reduce((sum,value)=>sum+value,0)
            const current=repository.listeningWindow(currentFrom,to),previous=repository.listeningWindow(previousFrom,currentFrom)
            const evidencePeriod={from:currentFrom,to,comparisonFrom:previousFrom,comparisonTo:currentFrom}
            const insights:Insight[]=[]
            const pushListening=(code:Insight["code"],level:Insight["evidenceLevel"])=>insights.push({code,family:"listening-balance",evidenceLevel:level,period:evidencePeriod,evidence:[
                {metric:"recent-listens",value:current.total},{metric:"previous-listens",value:previous.total},
                {metric:"recent-discovery-listens",value:current.discovery},{metric:"previous-discovery-listens",value:previous.discovery},
                {metric:"recent-familiar-listens",value:current.familiar},{metric:"previous-familiar-listens",value:previous.familiar},
            ]})
            if(current.total>=5&&previous.total>=5){
                const discoveryDelta=ratio(current.discovery,current.total)-ratio(previous.discovery,previous.total)
                const familiarDelta=ratio(current.familiar,current.total)-ratio(previous.familiar,previous.total)
                if(ratio(current.discovery,current.total)>=.6&&discoveryDelta>=.15)pushListening("discovery-rising",current.total>=10&&previous.total>=10?"strong":"supported")
                else if(ratio(current.familiar,current.total)>=.6&&familiarDelta>=.15)pushListening("familiarity-rising",current.total>=10&&previous.total>=10?"strong":"supported")
                else if(ratio(current.discovery+current.familiar,current.total)>=.7&&ratio(current.discovery,current.total)>=.3&&ratio(current.familiar,current.total)>=.3&&Math.abs(ratio(current.discovery,current.total)-ratio(current.familiar,current.total))<=.15)pushListening("listening-balanced",current.total>=10&&previous.total>=10?"strong":"supported")
            }
            const dormant=repository.dormantAlbums(currentFrom)
            if(libraryTotal>=20&&dormant>=5&&ratio(dormant,libraryTotal)>=.3)insights.push({code:"dormant-library",family:"library-activity",evidenceLevel:ratio(dormant,libraryTotal)>=.5?"strong":"supported",period:{from:currentFrom,to},evidence:[{metric:"dormant-albums",value:dormant},{metric:"library-albums",value:libraryTotal}]})
            const rediscovered=repository.rediscoveredListens(currentFrom,180)
            if(rediscovered>=2)insights.push({code:"rediscovery-moments",family:"rediscovery",evidenceLevel:rediscovered>=5?"strong":"supported",period:{from:currentFrom,to},evidence:[{metric:"rediscovered-listens",value:rediscovered},{metric:"recent-listens",value:current.total}]})
            const transitions=repository.recentRoleTransitions(previousFrom)
            if(transitions>=5)insights.push({code:"roles-in-motion",family:"role-movement",evidenceLevel:transitions>=10?"strong":"supported",period:{from:previousFrom,to},evidence:[{metric:"recent-role-transitions",value:transitions}]})
            const rotation=repository.rotationComparison()
            if(rotation&&rotation.entering+rotation.leaving>=4)insights.push({code:"rotation-evolving",family:"rotation-change",evidenceLevel:rotation.entering+rotation.leaving>=10?"strong":"supported",evidence:[{metric:"rotation-entering",value:rotation.entering},{metric:"rotation-leaving",value:rotation.leaving},{metric:"rotation-unchanged",value:rotation.unchanged}]})
            const priority:Insight["family"][]=["rediscovery","listening-balance","role-movement","rotation-change","library-activity"]
            insights.sort((a,b)=>priority.indexOf(a.family)-priority.indexOf(b.family))
            const buildingAreas:InsightsResponse["buildingAreas"]=[]
            if(libraryTotal<3)buildingAreas.push("library")
            if(current.total<5||previous.total<5)buildingAreas.push("listening-comparison")
            if(!rotation)buildingAreas.push("rotation-comparison")
            return {generatedAt:to,roleOverview:roles,insights:insights.slice(0,4),buildingAreas}
        },
    }
}
export type InsightsService=ReturnType<typeof createInsightsService>
