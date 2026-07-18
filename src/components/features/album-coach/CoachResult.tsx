import { useState } from "react"
import type { ArchiveReason } from "../../../domain/album/roleHistory"
import type { CoachRecommendation } from "../../../domain/album/determineRole"
import { roles,type RoleId } from "../../../domain/roles"
import { useI18n } from "../../../i18n/useI18n"

type Props={albumTitle:string;recommendation:CoachRecommendation;onAccept:(role:RoleId,archiveReason?:ArchiveReason)=>void;onBack:()=>void}
const archiveReasons:ArchiveReason[]=["not-interested-in-discovery","relationship-complete","canonical-but-not-personal","no-connection"]
export default function CoachResult({albumTitle,recommendation,onAccept,onBack}:Props){
    const {t}=useI18n();const [selectedRole,setSelectedRole]=useState<RoleId>(recommendation.role);const [archiveReason,setArchiveReason]=useState<ArchiveReason|undefined>(recommendation.archiveReason)
    const role=roles.find(candidate=>candidate.id===selectedRole)!
    const selectRole=(value:RoleId)=>{setSelectedRole(value);setArchiveReason(value==="archive"?recommendation.archiveReason:undefined)}
    return <section className="album-coach coach-result"><p className="coach-step">{t.coach.result.step}</p><p className="coach-album-title">{albumTitle}</p><h2>{t.coach.result.ourRecommendation}</h2><h1>{role.icon} {t.roles[selectedRole].title}</h1><p>{t.coach.reasons[recommendation.reasonCode]}</p><div className="coach-role-options" role="group" aria-label={t.coach.result.chooseRole}>{roles.map(candidate=><button className={selectedRole===candidate.id?"selected":""} key={candidate.id} onClick={()=>selectRole(candidate.id)}>{candidate.icon} {t.roles[candidate.id].title}</button>)}</div>
        {selectedRole==="archive"&&<fieldset className="coach-archive-reasons"><legend>{t.coach.result.archiveReason}</legend>{archiveReasons.map(reason=><label key={reason}><input type="radio" name="archive-reason" checked={archiveReason===reason} onChange={()=>setArchiveReason(reason)}/><span><strong>{t.coach.archiveReasons[reason].title}</strong>{t.coach.archiveReasons[reason].description}</span></label>)}</fieldset>}
        <div className="coach-result-actions"><button className="secondary" onClick={onBack}>{t.coach.result.back}</button><button disabled={selectedRole==="archive"&&!archiveReason} onClick={()=>onAccept(selectedRole,archiveReason)}>{t.coach.result.accept}</button></div>
    </section>
}
