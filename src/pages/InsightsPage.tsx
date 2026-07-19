import { useState } from "react"

import AlbumCoach from "../components/features/album-coach/AlbumCoach"
import ArchiveReturnCoach from "../components/features/archive/ArchiveReturnCoach"
import InsightsPanel from "../components/features/insights/InsightsPanel"
import EditAlbumDialog from "../components/features/library/EditAlbumDialog"
import ReflectionInbox from "../components/features/reflection/ReflectionInbox"
import RoleOverviewPanel from "../components/features/rotation-dashboard/RoleOverviewPanel"
import Button from "../components/ui/Button"
import Dialog from "../components/ui/Dialog"
import { useConnection } from "../contexts/connectionState"
import type { RoleId } from "../domain/roles"
import type { ArchiveReason } from "../domain/album/roleHistory"
import { useLibrary } from "../hooks/useLibrary"
import { useI18n } from "../i18n/useI18n"
import { useReflectionInbox } from "../hooks/useReflectionInbox"
import type { ReflectionInboxItem } from "../services/api/reflectionService"
import { useListenEvents } from "../hooks/useListenEvents"
import { useInsights } from "../hooks/useInsights"

export default function InsightsPage() {
    const { t } = useI18n()
    const { isOnline, apiReachable } = useConnection()
    const serverConnected = isOnline && apiReachable === true
    const { albums, isLoading, libraryError, refresh, updateAlbumRole,updateAlbum,updateAlbumCoverOverride,removeAlbumCoverOverride,retryAlbumCover } = useLibrary(serverConnected)
    const [reflectionAlbumId, setReflectionAlbumId] = useState<string | null>(null)
    const [archiveReturnAlbumId, setArchiveReturnAlbumId] = useState<string | null>(null)
    const [activeReflection,setActiveReflection]=useState<ReflectionInboxItem|null>(null)
    const [memoryAlbumId,setMemoryAlbumId]=useState<string|null>(null)
    const inbox=useReflectionInbox(serverConnected)
    const {listenEvents}=useListenEvents(albums,serverConnected)
    const insightEvidence=useInsights(serverConnected)

    const reflectionAlbum = albums.find(album => album.id === reflectionAlbumId)
    const archiveReturnAlbum = albums.find(album => album.id === archiveReturnAlbumId)
    const memoryAlbum=albums.find(album=>album.id===memoryAlbumId)

    async function handleReflectionComplete(role: RoleId,archiveReason?:ArchiveReason) {
        if (!reflectionAlbumId) return
        if (await updateAlbumRole(reflectionAlbumId, role, "reflection",archiveReason)) {
            if(activeReflection)await inbox.resolve(activeReflection.id,role)
            setReflectionAlbumId(null)
            setActiveReflection(null)
        }
    }

    async function handleArchiveReturnComplete(role: RoleId) {
        if (!archiveReturnAlbumId) return
        if (await updateAlbumRole(archiveReturnAlbumId, role, "reflection")) {
            if(activeReflection)await inbox.resolve(activeReflection.id,role)
            setArchiveReturnAlbumId(null)
            setActiveReflection(null)
        }
    }

    function handleReflect(item:ReflectionInboxItem) {
        setActiveReflection(item)
        if (item.ruleCode === "archive-return-candidate") {
            setArchiveReturnAlbumId(item.albumId)
        } else {
            setReflectionAlbumId(item.albumId)
        }
    }

    return (
        <main className="container insights-page">
            <header className="insights-page-header">
                <p>{t.insightsPage.kicker}</p>
                <h1>{t.insightsPage.title}</h1>
                <span>{t.insightsPage.description}</span>
            </header>

            {isLoading && <div className="sync-status" role="status">{t.home.syncingLibrary}</div>}
            {!isLoading && libraryError && (
                <div className="sync-status sync-status--warning" role="status">
                    <span>{t.home.libraryUnavailable}: {libraryError}</span>
                    <Button variant="secondary" onClick={() => void refresh()}>{t.home.retryLibrary}</Button>
                </div>
            )}

            {!isLoading && !libraryError && (
                <div className="insights-page-grid">
                    <section aria-labelledby="reflection-heading">
                        <h2 id="reflection-heading">{t.dashboard.nextQuestion}</h2>
                        <ReflectionInbox items={inbox.items} listenEvents={listenEvents} isLoading={inbox.isLoading} error={inbox.error} onRetry={()=>void inbox.refresh()} onReflect={handleReflect} onSnooze={(id,days)=>void inbox.snooze(id,days)} onDismiss={id=>void inbox.dismiss(id)} />
                    </section>
                    <InsightsPanel data={insightEvidence.data} isLoading={insightEvidence.isLoading} error={insightEvidence.error} onRetry={()=>void insightEvidence.refresh()} onOpenMemoryPrompt={setMemoryAlbumId} />
                    <section aria-labelledby="roles-heading">
                        <h2 id="roles-heading">{t.dashboard.roleOverview}</h2>
                        {insightEvidence.data&&<RoleOverviewPanel counts={insightEvidence.data.roleOverview} />}
                    </section>
                </div>
            )}

            <Dialog open={reflectionAlbum !== undefined}>
                {reflectionAlbum && (
                    <>
                        <AlbumCoach
                            key={`${reflectionAlbum.id}-${reflectionAlbum.roleHistory.length}`}
                            albumTitle={reflectionAlbum.title}
                            album={reflectionAlbum}
                            onComplete={handleReflectionComplete}
                        />
                        {activeReflection&&listenEvents.some(event=>activeReflection.evidence.recentJournalEventIds?.includes(event.id)&&event.journal)&&<details className="coach-journal-context"><summary>{t.journal.previous}</summary>{listenEvents.filter(event=>activeReflection.evidence.recentJournalEventIds?.includes(event.id)&&event.journal).map(event=><blockquote key={event.id}>{event.journal?.note}</blockquote>)}</details>}
                        <div className="dialog-actions">
                            <Button variant="secondary" onClick={() => setReflectionAlbumId(null)}>{t.reflection.later}</Button>
                        </div>
                    </>
                )}
            </Dialog>

            <Dialog open={archiveReturnAlbum !== undefined}>
                {archiveReturnAlbum && (
                    <>
                        <ArchiveReturnCoach
                            key={`${archiveReturnAlbum.id}-${archiveReturnAlbum.roleHistory.length}`}
                            albumTitle={archiveReturnAlbum.title}
                            onComplete={handleArchiveReturnComplete}
                        />
                        <div className="dialog-actions">
                            <Button variant="secondary" onClick={() => setArchiveReturnAlbumId(null)}>{t.archive.return.later}</Button>
                        </div>
                    </>
                )}
            </Dialog>

            {memoryAlbum&&<EditAlbumDialog
                key={`memory-${memoryAlbum.id}`}
                album={memoryAlbum}
                onClose={()=>setMemoryAlbumId(null)}
                onSave={async album=>{const saved=await updateAlbum(album);if(saved){setMemoryAlbumId(null);await insightEvidence.refresh()}return saved}}
                onUpdateCoverOverride={updateAlbumCoverOverride}
                onRemoveCoverOverride={removeAlbumCoverOverride}
                onRetryCover={retryAlbumCover}
                listenEvents={listenEvents}
            />}
        </main>
    )
}
