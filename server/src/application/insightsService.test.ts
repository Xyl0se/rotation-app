import { describe,expect,it } from "vitest"
import { createInsightsService } from "./insightsService.js"
import type { InsightEvidenceRepository } from "../infrastructure/persistence/sqlite/insightEvidenceRepository.js"

const roles=(overrides:Partial<ReturnType<InsightEvidenceRepository["roleOverview"]>>={})=>({new:0,growing:0,"comfort-food":0,classic:0,admire:0,archive:0,unassigned:0,...overrides})
const repository=(overrides:Partial<InsightEvidenceRepository>={}):InsightEvidenceRepository=>({
    roleOverview:()=>roles({new:10,growing:10,"comfort-food":10,classic:10}),
    listeningWindow:(from)=>from.startsWith("2026-04")?{total:10,discovery:8,familiar:2}:{total:10,discovery:3,familiar:7},
    dormantAlbums:()=>0,rediscoveredListens:()=>0,recentRoleTransitions:()=>0,rotationComparison:()=>null,...overrides,
})

describe("insights service",()=>{
    const now=new Date("2026-07-18T12:00:00.000Z")
    it("builds a traceable discovery comparison with a stable period",()=>{
        const result=createInsightsService(repository()).evaluate(now)
        expect(result.insights[0]).toMatchObject({code:"discovery-rising",evidenceLevel:"strong"})
        expect(result.insights[0]?.evidence).toEqual(expect.arrayContaining([{metric:"recent-listens",value:10}]))
        expect(result.generatedAt).toBe(now.toISOString())
    })
    it("suppresses sparse narratives and reports honest building areas",()=>{
        const result=createInsightsService(repository({roleOverview:()=>roles({new:2}),listeningWindow:()=>({total:1,discovery:1,familiar:0})})).evaluate(now)
        expect(result.insights).toEqual([])
        expect(result.buildingAreas).toEqual(expect.arrayContaining(["library","listening-comparison","rotation-comparison"]))
    })
    it("does not call unrelated listening roles a balanced discovery/familiarity pattern",()=>{
        const result=createInsightsService(repository({listeningWindow:()=>({total:10,discovery:0,familiar:0})})).evaluate(now)
        expect(result.insights.map(item=>item.code)).not.toContain("listening-balanced")
    })
    it("prioritizes rediscovery and exposes bounded factual evidence",()=>{
        const result=createInsightsService(repository({rediscoveredListens:()=>3,recentRoleTransitions:()=>6,rotationComparison:()=>({entering:4,leaving:4,unchanged:17})})).evaluate(now)
        expect(result.insights.map(item=>item.code)).toEqual(["rediscovery-moments","discovery-rising","roles-in-motion","rotation-evolving"])
        expect(JSON.stringify(result)).not.toContain("note")
    })
})
