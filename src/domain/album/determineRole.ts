import type { ArchiveReason } from "./roleHistory"
import type { RoleId } from "../roles"

export type ListeningExposure="none"|"up-to-three"|"more-than-three"
export type ReturnBehavior="regularly"|"occasionally"|"rarely"|"never"
export type OwnershipDuration="under-six-months"|"six-months-to-two-years"|"two-to-ten-years"|"over-ten-years"
export type RelationshipConclusion="keep-exploring"|"personally-valued"|"relationship-complete"|"canonical-but-not-personal"|"no-connection"

export interface AlbumCoachAnswers {
    exposure?:ListeningExposure
    connection?:1|2|3|4|5
    returnBehavior?:ReturnBehavior
    ownershipDuration?:OwnershipDuration
    formative?:boolean
    comfort?:boolean
    continuingDiscovery?:boolean
    wantsToExplore?:boolean
    conclusion?:RelationshipConclusion
}

export interface CoachRecommendation { role:RoleId;archiveReason?:ArchiveReason;reasonCode:"new-exploration"|"formative-classic"|"familiar-return"|"continuing-discovery"|"personal-admiration"|"declined-discovery"|"completed-relationship"|"canonical-distance"|"no-connection" }

export function determineRole(answers:AlbumCoachAnswers):CoachRecommendation {
    if(!answers.exposure)throw new Error("Incomplete answers: exposure")
    if(answers.exposure!=="more-than-three"){
        if(answers.wantsToExplore===true)return{role:"new",reasonCode:"new-exploration"}
        if(answers.wantsToExplore===false)return{role:"archive",archiveReason:"not-interested-in-discovery",reasonCode:"declined-discovery"}
        throw new Error("Incomplete answers: wantsToExplore")
    }
    if(!answers.connection||!answers.returnBehavior||!answers.ownershipDuration||answers.formative===undefined||answers.comfort===undefined||answers.continuingDiscovery===undefined)throw new Error("Incomplete relationship snapshot")
    if(answers.formative&&answers.connection>=4)return{role:"classic",reasonCode:"formative-classic"}
    if(answers.comfort&&answers.connection>=3&&["regularly","occasionally"].includes(answers.returnBehavior))return{role:"comfort-food",reasonCode:"familiar-return"}
    if(answers.continuingDiscovery&&answers.returnBehavior!=="never")return{role:"growing",reasonCode:"continuing-discovery"}
    if(answers.conclusion==="keep-exploring")return{role:"growing",reasonCode:"continuing-discovery"}
    if(answers.conclusion==="personally-valued"||(answers.connection>=3&&["rarely","never"].includes(answers.returnBehavior)))return{role:"admire",reasonCode:"personal-admiration"}
    if(answers.conclusion==="relationship-complete")return{role:"archive",archiveReason:"relationship-complete",reasonCode:"completed-relationship"}
    if(answers.conclusion==="canonical-but-not-personal")return{role:"archive",archiveReason:"canonical-but-not-personal",reasonCode:"canonical-distance"}
    if(answers.conclusion==="no-connection")return{role:"archive",archiveReason:"no-connection",reasonCode:"no-connection"}
    throw new Error("Incomplete answers: conclusion")
}
