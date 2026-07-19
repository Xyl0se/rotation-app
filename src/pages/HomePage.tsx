import { useState } from "react"

import type { RoleId } from "../domain/roles"
import type { ArchiveReason } from "../domain/album/roleHistory"

import { useLibrary } from "../hooks/useLibrary"
import { useRotationPlan } from "../hooks/useRotationPlan"
import { useListenEvents } from "../hooks/useListenEvents"
import { useBindings } from "../hooks/useBindings"
import { useReflectionInbox } from "../hooks/useReflectionInbox"
import { useAlbumRotationHistory } from "../hooks/useAlbumRotationHistory"
import { useConnection } from "../contexts/connectionState"

import EmptyLibrary from "../components/features/EmptyLibrary"
import Library from "../components/features/library/Library"
import DeleteAlbumDialog from "../components/features/library/DeleteAlbumDialog"
import EditAlbumDialog from "../components/features/library/EditAlbumDialog"
import FocusAlbumCard from "../components/features/focus-album/FocusAlbumCard"
import EmptyFocusAlbumCard from "../components/features/focus-album/EmptyFocusAlbumCard"
import PlayerRotation from "../components/features/player-rotation/PlayerRotation"
import Button from "../components/ui/Button"
import Dialog from "../components/ui/Dialog"
import AlbumCoach from "../components/features/album-coach/AlbumCoach"
import ArchiveProtectionCoach from "../components/features/archive/ArchiveProtectionCoach"
import ArchiveReturnCoach from "../components/features/archive/ArchiveReturnCoach"
import ListeningJournalEditor from "../components/features/listening/ListeningJournalEditor"
import AlbumDetailPage from "./AlbumDetailPage"

import { useI18n } from "../i18n/useI18n"

interface HomePageProps {
    onNavigateToBindings?: () => void
    highlightAlbumId?: string | null
    albumDetailId?: string | null
    onOpenAlbum?: (albumId: string) => void
    onCloseAlbum?: () => void
}

function HomePage({ onNavigateToBindings, highlightAlbumId, albumDetailId = null, onOpenAlbum, onCloseAlbum }: HomePageProps) {
    const { t } = useI18n()
    const [archiveAlbumId, setArchiveAlbumId] = useState<string | null>(null)
    const [archiveReturnAlbumId, setArchiveReturnAlbumId] = useState<string | null>(null)
    const [deleteAlbumId, setDeleteAlbumId] = useState<string | null>(null)
    const [editingAlbumId, setEditingAlbumId] = useState<string | null>(null)
    const [manualCoachAlbumId, setManualCoachAlbumId] = useState<string | null>(null)
    const [journalEditorEventId,setJournalEditorEventId]=useState<string|null>(null)

    const { isOnline, apiReachable } = useConnection()
    const serverConnected = isOnline && apiReachable === true

    const {
        albums,
        isLoading: isLibraryLoading,
        libraryError,
        refresh: refreshLibrary,
        deleteAlbum,
        updateAlbum,
        updateAlbumSources,
        updateAlbumRole,
        updateAlbumCoverOverride,
        removeAlbumCoverOverride,
        retryAlbumCover,
    } = useLibrary(serverConnected)

    const {
        rotationPlan,
        generatePlan,
        removeFromPlan,
        replaceAlbum,
        acceptPlan,
        getReplacementCandidates,
        focusAlbumId,
        setFocusAlbumId,
        suggestFocusAlbum,
        error: rotationError,
        isLoading: isRotationLoading,
    } = useRotationPlan(albums, serverConnected)

    const {
        listenEvents,
        logListen,
        saveJournal,
        deleteJournal,
        error: listenError,
        isLoading: isListenLoading,
    } = useListenEvents(albums, serverConnected)

    const { getBindingForLibraryAlbum, loading: bindingsLoading, error: bindingsError } = useBindings()
    const reflectionInbox = useReflectionInbox(serverConnected && albumDetailId !== null)
    const rotationHistory = useAlbumRotationHistory(albumDetailId, serverConnected)

    async function handleLogListen(id: string) {
        const event=await logListen(id)
        if(event){setJournalEditorEventId(event.id);await refreshLibrary()}
    }

    async function handleDeleteAlbum(id: string) {
        if (await deleteAlbum(id)) setDeleteAlbumId(null)
    }

    function handleArchiveComplete(role: RoleId) {
        if (!archiveAlbumId) {
            return
        }
        updateAlbumRole(archiveAlbumId, role, "archive")
        setArchiveAlbumId(null)
    }

    function handleArchiveReturnComplete(role: RoleId) {
        if (!archiveReturnAlbumId) {
            return
        }
        updateAlbumRole(archiveReturnAlbumId, role, "reflection")
        setArchiveReturnAlbumId(null)
    }

    const focusAlbum = albums.find(album => album.id === focusAlbumId)
    const archiveAlbum = albums.find(album => album.id === archiveAlbumId)
    const archiveReturnAlbum = albums.find(album => album.id === archiveReturnAlbumId)
    const deleteAlbumData = albums.find(album => album.id === deleteAlbumId)
    const editingAlbum = albums.find(album => album.id === editingAlbumId)
    const manualCoachAlbum = albums.find(album => album.id === manualCoachAlbumId)
    const journalEditorEvent=listenEvents.find(event=>event.id===journalEditorEventId)??null
    const journalEditorAlbum=albums.find(album=>album.id===journalEditorEvent?.albumId)
    const detailAlbum = albums.find(album => album.id === albumDetailId)

    async function handleManualCoachComplete(role: RoleId, archiveReason?:ArchiveReason) {
        if (!manualCoachAlbumId) return
        if (await updateAlbumRole(manualCoachAlbumId, role, "coach",archiveReason)) {
            setManualCoachAlbumId(null)
        }
    }

    const detailView = albumDetailId ? <AlbumDetailPage
        albumId={albumDetailId}
        album={detailAlbum}
        listenEvents={listenEvents}
        reflections={reflectionInbox.items}
        currentRotation={rotationPlan}
        historicRotations={rotationHistory.plans}
        binding={getBindingForLibraryAlbum(albumDetailId)}
        isLoading={isLibraryLoading || bindingsLoading || isRotationLoading || isListenLoading || reflectionInbox.isLoading || rotationHistory.isLoading}
        partialErrors={[libraryError, listenError, rotationError, bindingsError, reflectionInbox.error, rotationHistory.error].filter((value): value is string => Boolean(value))}
        onBack={() => onCloseAlbum?.()}
        onEdit={() => setEditingAlbumId(albumDetailId)}
        onLogListen={() => void handleLogListen(albumDetailId)}
        onSaveSources={(sources) => updateAlbumSources(albumDetailId, sources)}
    /> : null

    return (
        <>
        {detailView ?? <main className="container home-page">
            {isLibraryLoading && (
                <div className="sync-status" role="status">
                    {t.home.syncingLibrary}
                </div>
            )}
            {!isLibraryLoading && libraryError && (
                <div className="sync-status sync-status--warning" role="status">
                    <span>{t.home.libraryUnavailable}: {libraryError}</span>
                    <Button variant="secondary" onClick={() => void refreshLibrary()}>
                        {t.home.retryLibrary}
                    </Button>
                </div>
            )}
            {(rotationError || listenError) && (
                <div className="sync-status sync-status--warning" role="status">
                    {rotationError ?? listenError}
                </div>
            )}
            {
                albums.length === 0
                    ? (
                        <EmptyLibrary
                            onNavigateToBindings={() => onNavigateToBindings?.()}
                        />
                    )
                    : (
                        <>
                            {
                                focusAlbum ? (
                                    <FocusAlbumCard
                                        album={focusAlbum}
                                        listenEvents={listenEvents}
                                        onLogListen={() =>
                                            void handleLogListen(focusAlbum.id)
                                        }
                                        onSuggestAnother={() => void suggestFocusAlbum()}
                                        onEdit={() => setEditingAlbumId(focusAlbum.id)}
                                        onEditJournal={setJournalEditorEventId}
                                    />
                                ) : (
                                    <EmptyFocusAlbumCard
                                        hasActiveRotation={rotationPlan?.status === "active" && rotationPlan.items.length > 0}
                                        onSuggest={() => void suggestFocusAlbum()}
                                    />
                                )
                            }
                            <PlayerRotation
                                albums={albums}
                                plan={rotationPlan}
                                listenEvents={listenEvents}
                                onGenerate={generatePlan}
                                onRemove={removeFromPlan}
                                onReplace={replaceAlbum}
                                onAccept={acceptPlan}
                                onGetReplacementCandidates={getReplacementCandidates}
                            />
                            <Library
                                albums={albums}
                                focusAlbumId={focusAlbumId}
                                highlightAlbumId={highlightAlbumId}
                                onArchive={setArchiveAlbumId}
                                onDelete={setDeleteAlbumId}
                                onEdit={setEditingAlbumId}
                                onLogListen={(id) => void handleLogListen(id)}
                                onReconsider={setArchiveReturnAlbumId}
                                onSetFocus={setFocusAlbumId}
                                onStartCoach={setManualCoachAlbumId}
                                onOpenDetail={onOpenAlbum}
                            />
                        </>
                    )
            }
            </main>}
            {
                editingAlbum && (
                    <EditAlbumDialog
                        key={editingAlbum.id}
                        album={editingAlbum}
                        binding={getBindingForLibraryAlbum(editingAlbum.id)}
                        onClose={() => setEditingAlbumId(null)}
                        onSave={updateAlbum}
                        onUpdateCoverOverride={updateAlbumCoverOverride}
                        onRemoveCoverOverride={removeAlbumCoverOverride}
                        onRetryCover={retryAlbumCover}
                        onStartCoach={(albumId) => {
                            setEditingAlbumId(null)
                            setManualCoachAlbumId(albumId)
                        }}
                        listenEvents={listenEvents}
                        onEditJournal={(eventId)=>{setEditingAlbumId(null);setJournalEditorEventId(eventId)}}
                    />
                )
            }
            <DeleteAlbumDialog
                album={deleteAlbumData}
                onCancel={() => setDeleteAlbumId(null)}
                onConfirm={handleDeleteAlbum}
            />
            <ListeningJournalEditor key={journalEditorEvent?.id??"closed-journal"} event={journalEditorEvent} album={journalEditorAlbum} onClose={()=>setJournalEditorEventId(null)} onSave={saveJournal} onDelete={deleteJournal}/>
            <Dialog open={manualCoachAlbum !== undefined}>
                {manualCoachAlbum && (
                    <AlbumCoach
                        key={`manual-${manualCoachAlbum.id}`}
                        albumTitle={manualCoachAlbum.title}
                        album={manualCoachAlbum}
                        onComplete={handleManualCoachComplete}
                    />
                )}
            </Dialog>
            <Dialog open={archiveAlbum !== undefined}>
                {
                    archiveAlbum && (
                        <>
                            <ArchiveProtectionCoach
                                key={`${archiveAlbum.id}-${archiveAlbum.roleHistory.length}`}
                                albumTitle={archiveAlbum.title}
                                onComplete={handleArchiveComplete}
                            />
                            <div className="dialog-actions">
                                <Button
                                    variant="secondary"
                                    onClick={() => setArchiveAlbumId(null)}
                                >
                                    {t.archive.protection.cancel}
                                </Button>
                            </div>
                        </>
                    )
                }
            </Dialog>
            <Dialog open={archiveReturnAlbum !== undefined}>
                {
                    archiveReturnAlbum && (
                        <>
                            <ArchiveReturnCoach
                                key={`${archiveReturnAlbum.id}-${archiveReturnAlbum.roleHistory.length}`}
                                albumTitle={archiveReturnAlbum.title}
                                onComplete={handleArchiveReturnComplete}
                            />
                            <div className="dialog-actions">
                                <Button
                                    variant="secondary"
                                    onClick={() => setArchiveReturnAlbumId(null)}
                                >
                                    {t.archive.return.later}
                                </Button>
                            </div>
                        </>
                    )
                }
            </Dialog>
        </>
    )
}

export default HomePage
