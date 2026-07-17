import Button from "../../ui/Button"
import { useI18n } from "../../../i18n/useI18n"
import type { ReflectionInboxItem } from "../../../services/api/reflectionService"

const keyByRule={"new-after-listens":"newAfterListens","growing-for-a-while":"growingForAWhile","comfort-not-recent":"comfortNotRecent","archive-return-candidate":"archiveReturnCandidate","never-heard-dormant":"neverHeardDormant","rotation-absent-dormant":"rotationAbsentDormant"} as const
export default function ReflectionInbox({items,isLoading,error,onRetry,onReflect,onSnooze,onDismiss}:{items:ReflectionInboxItem[];isLoading:boolean;error:string|null;onRetry:()=>void;onReflect:(item:ReflectionInboxItem)=>void;onSnooze:(id:string,days:number)=>void;onDismiss:(id:string)=>void}) {
    const {t}=useI18n()
    if(isLoading)return <div className="reflection-inbox-state" role="status">{t.reflection.inbox.loading}</div>
    if(error)return <div className="reflection-inbox-state reflection-inbox-state--error" role="alert"><span>{t.reflection.inbox.unavailable}</span><Button variant="secondary" onClick={onRetry}>{t.reflection.inbox.retry}</Button></div>
    if(!items.length)return <div className="reflection-card reflection-card--empty"><p className="reflection-label">{t.reflection.empty.label}</p><h3>{t.reflection.empty.title}</h3><p>{t.reflection.empty.description}</p></div>
    return <div className="reflection-inbox-list">{items.map(item=>{
        const copy=t.reflection[keyByRule[item.ruleCode]]
        return <article className="reflection-inbox-item" key={item.id}>
            <div className="reflection-inbox-art">{item.albumCoverUrl?<img src={item.albumCoverUrl} alt=""/>:<span aria-hidden="true">◉</span>}</div>
            <div className="reflection-inbox-copy"><p className="reflection-label">{t.reflection.inbox.label}</p><h3>{item.albumTitle}</h3><p className="reflection-inbox-artist">{item.albumArtist}</p><strong>{copy.title}</strong><p>{copy.description}</p><small>{t.reflection.inbox.evidence.replace("{listens}",String(item.evidence.listenCount)).replace("{days}",String(item.evidence.daysInRole??0))}</small></div>
            <div className="reflection-inbox-actions"><Button onClick={()=>onReflect(item)}>{copy.action}</Button><Button variant="secondary" onClick={()=>onSnooze(item.id,30)}>{t.reflection.inbox.later30}</Button><Button variant="secondary" onClick={()=>onSnooze(item.id,90)}>{t.reflection.inbox.later90}</Button><Button variant="secondary" onClick={()=>onDismiss(item.id)}>{t.reflection.inbox.dismiss}</Button></div>
        </article>
    })}</div>
}
