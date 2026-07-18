import { useState } from "react"
import type { JournalContext,JournalMood,ListenEvent } from "../../../domain/listening/listenEvents"
import type { Album } from "../../../types/album"
import { useI18n } from "../../../i18n/useI18n"
import AlbumCover from "../../ui/AlbumCover"
import Button from "../../ui/Button"
import Dialog from "../../ui/Dialog"

const moods:JournalMood[]=["calm","energized","melancholic","curious","nostalgic"]
const contexts:JournalContext[]=["focused","background","on-the-go","evening","shared"]
type Draft={note:string;moodTags:JournalMood[];contextTags:JournalContext[]}
export default function ListeningJournalEditor({event,album,onClose,onSave,onDelete}:{event:ListenEvent|null;album:Album|undefined;onClose:()=>void;onSave:(id:string,draft:Draft)=>Promise<boolean>;onDelete:(id:string)=>Promise<boolean>}){
    const {t}=useI18n();const [draft,setDraft]=useState<Draft>(()=>({note:event?.journal?.note??"",moodTags:event?.journal?.moodTags??[],contextTags:event?.journal?.contextTags??[]}));const [error,setError]=useState(false);const [saving,setSaving]=useState(false)
    if(!event||!album)return null
    const toggle=<T extends string>(values:T[],value:T)=>values.includes(value)?values.filter(item=>item!==value):[...values,value]
    const save=async()=>{setSaving(true);setError(false);const ok=await onSave(event.id,draft);setSaving(false);if(ok)onClose();else setError(true)}
    const remove=async()=>{setSaving(true);setError(false);const ok=await onDelete(event.id);setSaving(false);if(ok)onClose();else setError(true)}
    return <Dialog open ariaLabel={t.journal.title} onClose={onClose}><section className="listening-journal-editor">
        <header><AlbumCover coverUrl={album.coverUrl} coverOverride={album.coverOverride} albumId={album.id} title={album.title} alt=""/><div><p>{t.journal.kicker}</p><h2>{album.title}</h2><span>{album.artist} · {new Date(event.listenedAt).toLocaleString()}</span></div></header>
        <label><span>{t.journal.note}</span><textarea autoFocus maxLength={2000} rows={7} value={draft.note} placeholder={t.journal.placeholder} onChange={e=>setDraft({...draft,note:e.target.value})}/><small>{draft.note.length}/2000</small></label>
        <fieldset><legend>{t.journal.mood}</legend><div className="journal-tags">{moods.map(value=><button type="button" aria-pressed={draft.moodTags.includes(value)} key={value} onClick={()=>setDraft({...draft,moodTags:toggle(draft.moodTags,value)})}>{t.journal.moods[value]}</button>)}</div></fieldset>
        <fieldset><legend>{t.journal.context}</legend><div className="journal-tags">{contexts.map(value=><button type="button" aria-pressed={draft.contextTags.includes(value)} key={value} onClick={()=>setDraft({...draft,contextTags:toggle(draft.contextTags,value)})}>{t.journal.contexts[value]}</button>)}</div></fieldset>
        {error&&<p role="alert" className="journal-error">{t.journal.saveError}</p>}
        <div className="dialog-actions">{event.journal&&<Button variant="secondary" disabled={saving} onClick={()=>void remove()}>{t.journal.delete}</Button>}<Button variant="secondary" disabled={saving} onClick={onClose}>{t.journal.cancel}</Button><Button disabled={saving} onClick={()=>void save()}>{t.journal.save}</Button></div>
    </section></Dialog>
}
