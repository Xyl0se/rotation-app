import { useState } from "react"
import type { ArchiveReason } from "../../../domain/album/roleHistory"
import { determineRole,type AlbumCoachAnswers,type CoachRecommendation } from "../../../domain/album/determineRole"
import type { RoleId } from "../../../domain/roles"
import type { Album } from "../../../types/album"
import CoachIntro from "./CoachIntro"
import CoachSnapshot from "./CoachSnapshot"
import CoachResult from "./CoachResult"

type AlbumCoachProps={albumTitle:string;onComplete:(role:RoleId,archiveReason?:ArchiveReason)=>void;album:Pick<Album,"id"|"coverUrl"|"coverOverride">}

export default function AlbumCoach({albumTitle,onComplete,album}:AlbumCoachProps){
    const [stage,setStage]=useState<"intro"|"snapshot"|"result">("intro")
    const [answers,setAnswers]=useState<AlbumCoachAnswers>({})
    const [recommendation,setRecommendation]=useState<CoachRecommendation|null>(null)
    const [validationError,setValidationError]=useState(false)
    function finishSnapshot(){try{setRecommendation(determineRole(answers));setValidationError(false);setStage("result")}catch{setValidationError(true)}}
    if(stage==="intro")return <CoachIntro albumTitle={albumTitle} albumId={album.id} coverUrl={album.coverUrl} coverOverride={album.coverOverride} onStart={()=>setStage("snapshot")}/>
    if(stage==="snapshot")return <CoachSnapshot albumTitle={albumTitle} answers={answers} onChange={value=>{setAnswers(value);setValidationError(false)}} onContinue={finishSnapshot} validationError={validationError}/>
    return <CoachResult albumTitle={albumTitle} recommendation={recommendation!} onBack={()=>setStage("snapshot")} onAccept={onComplete}/>
}
