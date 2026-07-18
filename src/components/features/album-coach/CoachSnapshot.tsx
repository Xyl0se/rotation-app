import type { AlbumCoachAnswers,ListeningExposure,OwnershipDuration,RelationshipConclusion,ReturnBehavior } from "../../../domain/album/determineRole"
import { useI18n } from "../../../i18n/useI18n"

type Props={albumTitle:string;answers:AlbumCoachAnswers;onChange:(answers:AlbumCoachAnswers)=>void;onContinue:()=>void;validationError:boolean}
export default function CoachSnapshot({albumTitle,answers,onChange,onContinue,validationError}:Props){
    const {t}=useI18n();const set=<K extends keyof AlbumCoachAnswers>(key:K,value:AlbumCoachAnswers[K])=>onChange({...answers,[key]:value})
    const choice=<T extends string>(name:string,values:readonly T[],value:T|undefined,labels:Record<T,string>,change:(value:T)=>void)=><div className="coach-segments">{values.map(option=><label className={value===option?"selected":""} key={option}><input type="radio" name={name} checked={value===option} onChange={()=>change(option)}/><span>{labels[option]}</span></label>)}</div>
    const mature=answers.exposure==="more-than-three"
    return <section className="album-coach coach-snapshot"><p className="coach-step">{t.coach.snapshot.step}</p><p className="coach-album-title">{albumTitle}</p><h2>{t.coach.snapshot.title}</h2><p>{t.coach.snapshot.description}</p><div className="coach-snapshot-fields">
        <fieldset><legend>{t.coach.snapshot.exposure.label}</legend>{choice<ListeningExposure>("exposure",["none","up-to-three","more-than-three"],answers.exposure,t.coach.snapshot.exposure.options,value=>set("exposure",value))}</fieldset>
        {answers.exposure&& !mature&&<fieldset><legend>{t.coach.snapshot.explore.label}</legend>{choice("explore",["yes","no"] as const,answers.wantsToExplore===undefined?undefined:answers.wantsToExplore?"yes":"no",t.coach.snapshot.yesNo,value=>set("wantsToExplore",value==="yes"))}</fieldset>}
        {mature&&<>
            <fieldset><legend>{t.coach.snapshot.connection}</legend>{choice("connection",["1","2","3","4","5"] as const,answers.connection?String(answers.connection) as "1"|"2"|"3"|"4"|"5":undefined,t.coach.snapshot.connectionOptions,value=>set("connection",Number(value) as 1|2|3|4|5))}</fieldset>
            <fieldset><legend>{t.coach.snapshot.returnBehavior.label}</legend>{choice<ReturnBehavior>("return",["regularly","occasionally","rarely","never"],answers.returnBehavior,t.coach.snapshot.returnBehavior.options,value=>set("returnBehavior",value))}</fieldset>
            <fieldset><legend>{t.coach.snapshot.ownership.label}</legend>{choice<OwnershipDuration>("ownership",["under-six-months","six-months-to-two-years","two-to-ten-years","over-ten-years"],answers.ownershipDuration,t.coach.snapshot.ownership.options,value=>set("ownershipDuration",value))}</fieldset>
            {(["formative","comfort","continuingDiscovery"] as const).map(key=><fieldset key={key}><legend>{t.coach.snapshot.binary[key]}</legend>{choice(`${key}`,["yes","no"] as const,answers[key]===undefined?undefined:answers[key]?"yes":"no",t.coach.snapshot.yesNo,value=>set(key,value==="yes"))}</fieldset>)}
            <fieldset><legend>{t.coach.snapshot.conclusion.label}</legend>{choice<RelationshipConclusion>("conclusion",["keep-exploring","personally-valued","relationship-complete","canonical-but-not-personal","no-connection"],answers.conclusion,t.coach.snapshot.conclusion.options,value=>set("conclusion",value))}</fieldset>
        </>}
    </div>{validationError&&<p className="coach-validation" role="alert">{t.coach.snapshot.validation}</p>}<button onClick={onContinue}>{t.coach.snapshot.continue}</button></section>
}
