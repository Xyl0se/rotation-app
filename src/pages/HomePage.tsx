import { useState } from "react"

import type { RoleId } from "../domain/roles"
import type { StorageAdapter } from "../adapters/storageAdapter"

import { useLibrary } from "../hooks/useLibrary"
import { useRotationPlan } from "../hooks/useRotationPlan"
import { useListenEvents } from "../hooks/useListenEvents"
import { useBindings } from "../hooks/useBindings"
import { useConnection } from "../contexts/connectionState"

import EmptyLibrary from "../components/features/EmptyLibrary"
import Library from "../components/features/library/Library"
import DeleteAlbumDialog from "../components/features/library/DeleteAlbumDialog"
import EditAlbumDialog from "../components/features/library/EditAlbumDialog"
import FocusAlbumCard from "../components/features/focus-album/FocusAlbumCard"
import EmptyFocusAlbumCard from "../components/features/focus-album/EmptyFocusAlbumCard"
import Dashboard from "../components/features/dashboard/Dashboard"
import PlayerRotation from "../components/features/player-rotation/PlayerRotation"
import Button from "../components/ui/Button"
import Dialog from "../components/ui/Dialog"
import AlbumCoach from "../components/features/album-coach/AlbumCoach"
import CoachOrphanPrompt from "../components/features/album-coach/CoachOrphanPrompt"
import ArchiveProtectionCoach from "../components/features/archive/ArchiveProtectionCoach"
import ArchiveReturnCoach from "../components/features/archive/ArchiveReturnCoach"
import BackupControls from "../components/features/backup/BackupControls"

import { evaluateReflection } from "../domain/reflection/evaluateReflection"
import { useI18n } from "../i18n/useI18n"

interface HomePageProps {
    adapter: StorageAdapter
    onNavigateToBindings?: () => void
    highlightAlbumId?: string | null
}

function HomePage({ adapter, onNavigateToBindings, highlightAlbumId }: HomePageProps) {
    const { t } = useI18n()
    const [reflectionAlbumId, setReflectionAlbumId] = useState<string | null>(null)
    const [archiveAlbumId, setArchiveAlbumId] = useState<string | null>(null)
    const [archiveReturnAlbumId, setArchiveReturnAlbumId] = useState<string | null>(null)
    const [deleteAlbumId, setDeleteAlbumId] = useState<string | null>(null)
    const [editingAlbumId, setEditingAlbumId] = useState<string | null>(null)
    const [manualCoachAlbumId, setManualCoachAlbumId] = useState<string | null>(null)

    const { isOnline, apiReachable } = useConnection()
    const serverConnected = isOnline && apiReachable === true

    const {
        albums,
        isLoading: isLibraryLoading,
        libraryError,
        refresh: refreshLibrary,
        deleteAlbum,
        updateAlbum,
        updateAlbumRole,
        updateAlbumCoverOverride,
        setCoverUrlOverride,
        removeAlbumCoverOverride,
        retryAlbumCover,
    } = useLibrary(adapter, serverConnected)

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
    } = useRotationPlan(albums, serverConnected)

    const {
        listenEvents,
        logListen,
        error: listenError,
    } = useListenEvents(albums, serverConnected)

    const { orphans, getBindingForLibraryAlbum } = useBindings()

    const [orphanPromptDismissed, setOrphanPromptDismissed] = useState(() => {
        try {
            return localStorage.getItem("rotation:orphanPromptDismissed") === "true"
        } catch {
            return false
        }
    })

    function handleDismissOrphanPrompt() {
        setOrphanPromptDismissed(true)
        try {
            localStorage.setItem("rotation:orphanPromptDismissed", "true")
        } catch {
            // ignore
        }
    }

    async function handleLogListen(id: string) {
        if (await logListen(id)) await refreshLibrary()
    }

    async function handleDeleteAlbum(id: string) {
        if (await deleteAlbum(id)) setDeleteAlbumId(null)
    }

    function handleReflectionComplete(role: RoleId) {
        if (!reflectionAlbumId) {
            return
        }
        updateAlbumRole(reflectionAlbumId, role, "reflection")
        setReflectionAlbumId(null)
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
    const reflectionPrompt = evaluateReflection(albums).prompts[0]
    const reflectionAlbum = albums.find(album => album.id === reflectionAlbumId)
    const archiveAlbum = albums.find(album => album.id === archiveAlbumId)
    const archiveReturnAlbum = albums.find(album => album.id === archiveReturnAlbumId)
    const deleteAlbumData = albums.find(album => album.id === deleteAlbumId)
    const editingAlbum = albums.find(album => album.id === editingAlbumId)
    const manualCoachAlbum = albums.find(album => album.id === manualCoachAlbumId)

    async function handleManualCoachComplete(role: RoleId) {
        if (!manualCoachAlbumId) return
        if (await updateAlbumRole(manualCoachAlbumId, role, "coach")) {
            setManualCoachAlbumId(null)
        }
    }

    return (
        <main className="container">
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
                orphans.length > 0 && !orphanPromptDismissed && (
                    <CoachOrphanPrompt
                        title={t.coach.orphanPrompt.title}
                        description={t.coach.orphanPrompt.description}
                        dismissLabel={t.coach.orphanPrompt.dismiss}
                        captureLabel={t.coach.orphanPrompt.capture}
                        onDismiss={handleDismissOrphanPrompt}
                        onCapture={() => {
                            onNavigateToBindings?.()
                        }}
                    />
                )
            }
            {
                albums.length === 0
                    ? (
                        <EmptyLibrary
                            adapter={adapter}
                            onNavigateToBindings={() => onNavigateToBindings?.()}
                            onBackupRestored={() => window.location.reload()}
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
                                    />
                                ) : (
                                    <EmptyFocusAlbumCard
                                        hasActiveRotation={rotationPlan?.status === "active" && rotationPlan.items.length > 0}
                                        onSuggest={() => void suggestFocusAlbum()}
                                    />
                                )
                            }
                            <Dashboard
                                albums={albums}
                                reflectionPrompt={reflectionPrompt}
                                onReflect={() => {
                                    if (!reflectionPrompt) {
                                        return
                                    }
                                    if (reflectionPrompt.code === "archive-return-candidate") {
                                        setArchiveReturnAlbumId(reflectionPrompt.album.id)
                                        return
                                    }
                                    setReflectionAlbumId(reflectionPrompt.album.id)
                                }}
                            />
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
                            />
                            <BackupControls
                                adapter={adapter}
                                onRestored={() => window.location.reload()}
                            />
                        </>
                    )
            }
            {
                editingAlbum && (
                    <EditAlbumDialog
                        key={editingAlbum.id}
                        album={editingAlbum}
                        binding={getBindingForLibraryAlbum(editingAlbum.id)}
                        onClose={() => setEditingAlbumId(null)}
                        onSave={updateAlbum}
                        onUpdateCoverOverride={updateAlbumCoverOverride}
                        onSetCoverUrlOverride={setCoverUrlOverride}
                        onRemoveCoverOverride={removeAlbumCoverOverride}
                        onRetryCover={retryAlbumCover}
                        onStartCoach={(albumId) => {
                            setEditingAlbumId(null)
                            setManualCoachAlbumId(albumId)
                        }}
                    />
                )
            }
            <DeleteAlbumDialog
                album={deleteAlbumData}
                onCancel={() => setDeleteAlbumId(null)}
                onConfirm={handleDeleteAlbum}
            />
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
            <Dialog open={reflectionAlbum !== undefined}>
                {
                    reflectionAlbum && (
                        <>
                            <AlbumCoach
                                key={`${reflectionAlbum.id}-${reflectionAlbum.roleHistory.length}`}
                                albumTitle={reflectionAlbum.title}
                                album={reflectionAlbum}
                                onComplete={handleReflectionComplete}
                            />
                            <div className="dialog-actions">
                                <Button
                                    variant="secondary"
                                    onClick={() => setReflectionAlbumId(null)}
                                >
                                    {t.reflection.later}
                                </Button>
                            </div>
                        </>
                    )
                }
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
        </main>
    )
}

export default HomePage
