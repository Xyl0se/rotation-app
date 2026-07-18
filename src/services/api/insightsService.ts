import { get } from "./apiClient.js"
import type { RoleId } from "../../domain/roles.js"

export type InsightCode="discovery-rising"|"familiarity-rising"|"listening-balanced"|"dormant-library"|"rediscovery-moments"|"roles-in-motion"|"rotation-evolving"
export type InsightMetric="recent-listens"|"previous-listens"|"recent-discovery-listens"|"previous-discovery-listens"|"recent-familiar-listens"|"previous-familiar-listens"|"dormant-albums"|"library-albums"|"rediscovered-listens"|"recent-role-transitions"|"rotation-entering"|"rotation-leaving"|"rotation-unchanged"
export type InsightBuildingArea="library"|"listening-comparison"|"rotation-comparison"
export interface ServerInsight {code:InsightCode;family:string;evidenceLevel:"supported"|"strong";period?:{from:string;to:string;comparisonFrom?:string;comparisonTo?:string};evidence:Array<{metric:InsightMetric;value:number}>}
export type ServerRoleOverview=Record<RoleId|"unassigned",number>
export interface InsightsResponse {generatedAt:string;roleOverview:ServerRoleOverview;insights:ServerInsight[];buildingAreas:InsightBuildingArea[]}
export const fetchInsights=():Promise<InsightsResponse>=>get("/insights")
