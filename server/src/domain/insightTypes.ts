import type { RoleId } from "./albumTypes.js"

export type InsightFamily = "listening-balance" | "library-activity" | "rediscovery" | "role-movement" | "rotation-change" | "artist" | "era" | "personal-history"
export type InsightCode = "discovery-rising" | "familiarity-rising" | "listening-balanced" | "dormant-library" | "rediscovery-moments" | "roles-in-motion" | "rotation-evolving" | "recurring-artist" | "listening-era" | "life-phase-return" | "acquisition-thread"
export type InsightEvidenceLevel = "supported" | "strong"
export type InsightMetric = "recent-listens" | "previous-listens" | "recent-discovery-listens" | "previous-discovery-listens" | "recent-familiar-listens" | "previous-familiar-listens" | "dormant-albums" | "library-albums" | "rediscovered-listens" | "recent-role-transitions" | "rotation-entering" | "rotation-leaving" | "rotation-unchanged" | "artist-listens" | "artist-albums" | "known-year-albums" | "era-listens" | "era-albums" | "annotated-albums" | "personal-theme-listens"
export type InsightBuildingArea = "library" | "listening-comparison" | "rotation-comparison"

export interface InsightEvidenceItem { metric:InsightMetric;value:number }
export interface InsightPeriod { from:string;to:string;comparisonFrom?:string;comparisonTo?:string }
export interface InsightSubject { kind:"artist"|"era"|"life-phase"|"acquisition";value:string }
export interface Insight { code:InsightCode;family:InsightFamily;evidenceLevel:InsightEvidenceLevel;subject?:InsightSubject;period?:InsightPeriod;evidence:InsightEvidenceItem[] }
export type RoleOverview = Record<RoleId | "unassigned",number>
export interface InsightsResponse { generatedAt:string;roleOverview:RoleOverview;insights:Insight[];buildingAreas:InsightBuildingArea[] }
