import { describe,expect,it } from "vitest"
import { createInsightsService } from "./insightsService.js"
import type { InsightEvidenceRepository } from "../infrastructure/persistence/sqlite/insightEvidenceRepository.js"

const roles=(overrides:Partial<ReturnType<InsightEvidenceRepository["roleOverview"]>>={})=>({new:0,growing:0,"comfort-food":0,classic:0,admire:0,archive:0,unassigned:0,...overrides})
const repository=(overrides:Partial<InsightEvidenceRepository>={}):InsightEvidenceRepository=>({
    roleOverview:()=>roles({new:10,growing:10,"comfort-food":10,classic:10}),
    listeningWindow:(from)=>from.startsWith("2026-04")?{total:10,discovery:8,familiar:2}:{total:10,discovery:3,familiar:7},
    dormantAlbums:()=>0,rediscoveredListens:()=>0,recentRoleTransitions:()=>0,rotationComparison:()=>null,
    recurringArtist:()=>null,listeningEra:()=>null,personalHistory:()=>null,memoryPromptCandidates:()=>[],...overrides,
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
        expect(result.insights.map(item=>item.code)).toEqual(expect.arrayContaining(["rediscovery-moments","discovery-rising","roles-in-motion","rotation-evolving"]))
        expect(JSON.stringify(result)).not.toContain("note")
    })
    it("adds bounded extended families and keeps weekly selection stable",()=>{
        const source=repository({recurringArtist:()=>({artist:"Air",listenCount:4,albumCount:2,totalListens:10}),listeningEra:()=>({era:"1990s",listenCount:4,albumCount:6,knownYearAlbums:30,totalKnownYearListens:8}),personalHistory:()=>({kind:"life-phase",value:"school",listenCount:4,annotatedAlbums:12})})
        const service=createInsightsService(source),first=service.evaluate(now),again=service.evaluate(new Date("2026-07-19T12:00:00.000Z"))
        expect(first.insights).toHaveLength(4);expect(first.insights.map(item=>`${item.code}:${item.subject?.value??""}`)).toEqual(again.insights.map(item=>`${item.code}:${item.subject?.value??""}`))
        expect(first.insights.flatMap(item=>item.subject?.value??[])).toEqual(expect.arrayContaining(["Air","1990s","school"]))
    })
    it("selects a weekly stable memory prompt and avoids recent weekly repeats",()=>{
        const candidates=Array.from({length:12},(_,index)=>({albumId:`album-${index}`,title:`Album ${index}`,artist:`Artist ${index}`,missingAcquisition:true,missingLifePhase:index%2===0}))
        const service=createInsightsService(repository({memoryPromptCandidates:()=>candidates}))
        const first=service.evaluate(now).memoryPrompt
        expect(first).toMatchObject({albumId:expect.any(String),missingField:expect.stringMatching(/^(acquiredBecause|lifePhase)$/)})
        expect(service.evaluate(new Date("2026-07-19T12:00:00.000Z")).memoryPrompt).toEqual(first)
        const weekly=Array.from({length:9},(_,offset)=>service.evaluate(new Date(now.getTime()+offset*7*86_400_000)).memoryPrompt?.albumId)
        expect(new Set(weekly).size).toBe(9)
    })
})
