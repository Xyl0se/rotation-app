import type { AlbumRepository } from "../infrastructure/persistence/sqlite/albumRepository.js"
import type { ReflectionInboxRepository } from "../infrastructure/persistence/sqlite/reflectionInboxRepository.js"
import type { ReflectionEvidence, ReflectionRuleCode } from "../domain/reflectionTypes.js"
import type { RotationStateRepository } from "../infrastructure/persistence/sqlite/rotationStateRepository.js"

const DAY=86_400_000
const days=(value:string|null,now:Date):number|null => value ? Math.max(0,Math.floor((now.getTime()-new Date(value).getTime())/DAY)) : null

export function createReflectionInboxService(albums:AlbumRepository,inbox:ReflectionInboxRepository,rotations?:RotationStateRepository) {
    function evaluate(now=new Date()) {
        const candidates=[] as Array<{albumId:string;ruleCode:ReflectionRuleCode;evidenceKey:string;evidence:ReflectionEvidence;dueAt:string}>
        const recentPlans=[rotations?.findActive(),...(rotations?.findHistory(5).items ?? [])].filter((plan):plan is NonNullable<typeof plan>=>plan!=null)
        const journalEvents=rotations?.findListenEvents(5_000)??[]
        for (const album of albums.findAll()) {
            if (!album.category) continue
            const roleSince=album.roleHistory.at(-1)?.recordedAt ?? album.createdAt ?? null
            const lastListened=album.lastListened ?? null
            const recentRotationCount=recentPlans.filter(plan=>plan.albumIds.includes(album.id)).length
            const evidence:ReflectionEvidence={role:album.category,listenCount:album.listenCount,lastListened,
                roleSince,daysInRole:days(roleSince,now),daysSinceListen:days(lastListened,now),recentRotationCount,
                recentJournalEventIds:journalEvents.filter(event=>event.albumId===album.id&&event.journal).slice(0,3).map(event=>event.id)}
            let ruleCode:ReflectionRuleCode|undefined
            if (album.category === "new" && album.listenCount >= 3) ruleCode="new-after-listens"
            else if (album.category === "growing" && (evidence.daysInRole ?? 0) >= 90) ruleCode="growing-for-a-while"
            else if (album.category === "comfort-food" && (evidence.daysSinceListen ?? 0) >= 60) ruleCode="comfort-not-recent"
            else if (album.category === "archive" && (evidence.daysInRole ?? 0) >= 180) {
                ruleCode="archive-return-candidate"
                evidence.archiveTemperature=(evidence.daysSinceListen ?? evidence.daysInRole ?? 0) >= 365 ? "cold" : "warm"
            } else if (album.listenCount === 0 && (evidence.daysInRole ?? 0) >= 120) ruleCode="never-heard-dormant"
            else if (recentPlans.length >= 3 && recentRotationCount === 0 && (evidence.daysInRole ?? 0) >= 120) ruleCode="rotation-absent-dormant"
            if (!ruleCode) continue
            const evidenceWindow=`${roleSince}:${Math.floor(album.listenCount/3)}:${album.lastListened ?? "never"}`
            const deferrals=inbox.countDeferrals(album.id,ruleCode,roleSince)
            if(ruleCode==="archive-return-candidate" && deferrals>=2)evidence.archiveTemperature="cold"
            const quietDays=Math.min(180,deferrals === 0 ? 0 : 30*(2**Math.min(deferrals-1,3)))
            const dueAt=new Date(now.getTime()+quietDays*DAY).toISOString()
            candidates.push({albumId:album.id,ruleCode,evidenceKey:evidenceWindow,evidence,dueAt})
        }
        inbox.upsertCandidates(candidates,now.toISOString())
        return inbox.listActionable(now.toISOString())
    }
    return { evaluate,list:()=>inbox.listActionable(),snooze:(id:string,until:string)=>inbox.transition(id,"snoozed",new Date().toISOString(),{snoozedUntil:until}),
        dismiss:(id:string)=>inbox.transition(id,"dismissed",new Date().toISOString(),{resolution:"dismissed-for-evidence"}),
        resolve:(id:string,resolution:string)=>inbox.transition(id,"resolved",new Date().toISOString(),{resolution}) }
}
export type ReflectionInboxService=ReturnType<typeof createReflectionInboxService>
