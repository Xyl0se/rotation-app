import type { RoleId } from "./albumTypes.js"

export type InsightFamily = "listening-balance" | "library-activity" | "rediscovery" | "role-movement" | "rotation-change"
export type InsightCode = "discovery-rising" | "familiarity-rising" | "listening-balanced" | "dormant-library" | "rediscovery-moments" | "roles-in-motion" | "rotation-evolving"
export type InsightEvidenceLevel = "supported" | "strong"
export type InsightMetric = "recent-listens" | "previous-listens" | "recent-discovery-listens" | "previous-discovery-listens" | "recent-familiar-listens" | "previous-familiar-listens" | "dormant-albums" | "library-albums" | "rediscovered-listens" | "recent-role-transitions" | "rotation-entering" | "rotation-leaving" | "rotation-unchanged"
export type InsightBuildingArea = "library" | "listening-comparison" | "rotation-comparison"

export interface InsightEvidenceItem { metric:InsightMetric;value:number }
export interface InsightPeriod { from:string;to:string;comparisonFrom?:string;comparisonTo?:string }
export interface Insight { code:InsightCode;family:InsightFamily;evidenceLevel:InsightEvidenceLevel;period?:InsightPeriod;evidence:InsightEvidenceItem[] }
export type RoleOverview = Record<RoleId | "unassigned",number>
export interface InsightsResponse { generatedAt:string;roleOverview:RoleOverview;insights:Insight[];buildingAreas:InsightBuildingArea[] }
