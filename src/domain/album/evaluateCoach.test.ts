import {describe,expect,it} from "vitest"
import {evaluateCoach} from "./evaluateCoach"
describe("evaluateCoach",()=>{
    it("keeps an incomplete snapshot on the single Coach stage",()=>expect(evaluateCoach({})).toEqual({finished:false,nextQuestion:"snapshot"}))
    it("returns the complete explainable recommendation",()=>expect(evaluateCoach({exposure:"none",wantsToExplore:false})).toEqual({finished:true,role:"archive",archiveReason:"not-interested-in-discovery",reasonCode:"declined-discovery"}))
})
