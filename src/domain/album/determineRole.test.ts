import {describe,expect,it} from "vitest"
import {determineRole,type AlbumCoachAnswers} from "./determineRole"

const mature:AlbumCoachAnswers={exposure:"more-than-three",connection:3,returnBehavior:"occasionally",ownershipDuration:"two-to-ten-years",formative:false,comfort:false,continuingDiscovery:false}
describe("determineRole snapshot policy",()=>{
    it("keeps insufficient exposure new only after explicit interest",()=>{
        expect(determineRole({exposure:"up-to-three",wantsToExplore:true})).toMatchObject({role:"new",reasonCode:"new-exploration"})
        expect(determineRole({exposure:"none",wantsToExplore:false})).toMatchObject({role:"archive",archiveReason:"not-interested-in-discovery"})
        expect(()=>determineRole({exposure:"up-to-three"})).toThrow("wantsToExplore")
    })
    it("prioritizes personal Classic, Comfort and Growth evidence",()=>{
        expect(determineRole({...mature,connection:5,formative:true,comfort:true})).toMatchObject({role:"classic"})
        expect(determineRole({...mature,connection:4,comfort:true})).toMatchObject({role:"comfort-food"})
        expect(determineRole({...mature,continuingDiscovery:true})).toMatchObject({role:"growing"})
    })
    it("distinguishes personal admiration from external canonical status",()=>{
        expect(determineRole({...mature,returnBehavior:"rarely",connection:4})).toMatchObject({role:"admire"})
        expect(determineRole({...mature,connection:1,returnBehavior:"never",conclusion:"canonical-but-not-personal"})).toMatchObject({role:"archive",archiveReason:"canonical-but-not-personal"})
    })
    it.each([
        ["relationship-complete","relationship-complete"],["canonical-but-not-personal","canonical-but-not-personal"],["no-connection","no-connection"],
    ] as const)("records the explicit %s Archive reason",(conclusion,archiveReason)=>expect(determineRole({...mature,connection:1,returnBehavior:"never",conclusion})).toMatchObject({role:"archive",archiveReason}))
    it("does not use Archive as an ambiguous fallback",()=>expect(()=>determineRole({...mature,connection:1,returnBehavior:"never"})).toThrow("conclusion"))
})
