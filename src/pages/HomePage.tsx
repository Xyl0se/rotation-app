import { useState } from "react"

import type { Album } from "../types/album"
import type { RoleId } from "../domain/roles"
import type { StorageAdapter } from "../adapters/storageAdapter"

import { useLibrary } from "../hooks/useLibrary"
import { useRotationPlan } from "../hooks/useRotationPlan"
import { useListenEvents } from "../hooks/useListenEvents"
import { createRepositories } from "../repositories/factory"

import Header from "../components/features/Header"
import EmptyLibrary from "../components/features/EmptyLibrary"
import DiscoverAlbumDialog from "../components/features/discover-album/DiscoverAlbumDialog"
import Library from "../components/features/library/Library"
import DeleteAlbumDialog from "../components/features/library/DeleteAlbumDialog"
import EditAlbumDialog from "../components/features/library/EditAlbumDialog"
import FocusAlbumCard from "../components/features/focus-album/FocusAlbumCard"
import Dashboard from "../components/features/dashboard/Dashboard"
import PlayerRotation from "../components/features/player-rotation/PlayerRotation"
import Button from "../components/ui/Button"
import Dialog from "../components/ui/Dialog"
import AlbumCoach from "../components/features/album-coach/AlbumCoach"
import ArchiveProtectionCoach from "../components/features/archive/ArchiveProtectionCoach"
import ArchiveReturnCoach from "../components/features/archive/ArchiveReturnCoach"
import BackupControls from "../components/features/backup/BackupControls"

import { evaluateReflection } from "../domain/reflection/evaluateReflection"
import { generateUUID } from "../utils/uuid"
import { useI18n } from "../i18n/I18nContext"

function createEmptyAlbum(): Album {
    return {
        id: generateUUID(),
        title: "",
        artist: "",
        year: "",
        roleHistory: [],
        listenCount: 0,
        lastListened: null,
    }
}

interface HomePageProps {
    adapter: StorageAdapter
}

function HomePage({ adapter }: HomePageProps) {
    const { t } = useI18n()
    const [dialogOpen, setDialogOpen] = useState(false)
    const [reflectionAlbumId, setReflectionAlbumId] = useState<string | null>(null)
    const [archiveAlbumId, setArchiveAlbumId] = useState<string | null>(null)
    const [archiveReturnAlbumId, setArchiveReturnAlbumId] = useState<string | null>(null)
    const [deleteAlbumId, setDeleteAlbumId] = useState<string | null>(null)
    const [editingAlbumId, setEditingAlbumId] = useState<string | null>(null)
    const [album, setAlbum] = useState(createEmptyAlbum)

    const repositories = createRepositories(adapter)

    const {
        albums,
        focusAlbumId,
        setFocusAlbumId,
        addAlbum,
        deleteAlbum,
        updateAlbum,
        updateAlbumRole,
        logListenForAlbum,
        updateAlbumCoverOverride,
        setCoverUrlOverride,
        removeAlbumCoverOverride,
    } = useLibrary(repositories.album, adapter)

    const {
        rotationPlan,
        generatePlan,
        removeFromPlan,
        replaceAlbum,
        acceptPlan,
        getReplacementCandidates,
    } = useRotationPlan(repositories.rotationPlan, albums)

    const {
        listenEvents,
        logListen,
    } = useListenEvents(repositories.listenEvents, albums, adapter)

    function handleNewAlbum() {
        setAlbum(createEmptyAlbum())
        setDialogOpen(true)
    }

    function handleSuggestFocusAlbum() {
        const candidates = albums.filter(
            a => a.id !== focusAlbumId && a.category !== "archive",
        )

        if (candidates.length === 0) {
            return
        }

        const randomIndex = Math.floor(Math.random() * candidates.length)
        setFocusAlbumId(candidates[randomIndex].id)
    }

    function handleFinish(completedAlbum: Album) {
        addAlbum(completedAlbum)
        setDialogOpen(false)
        setAlbum(createEmptyAlbum())
    }

    function handleLogListen(id: string) {
        logListen(id)
        logListenForAlbum(id)
    }

    function handleDeleteAlbum(id: string) {
        deleteAlbum(id)
        setDeleteAlbumId(null)
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

    return (
        <main className="container">
            <Header />
            {
                albums.length === 0
                    ? (
                        <EmptyLibrary
                            adapter={adapter}
                            onDiscoverAlbum={handleNewAlbum}
                            onBackupRestored={() => window.location.reload()}
                        />
                    )
                    : (
                        <>
                            <div className="toolbar">
                                <Button
                                    variant="secondary"
                                    onClick={handleSuggestFocusAlbum}
                                >
                                    {t.home.suggestFocusAlbum}
                                </Button>
                                <Button onClick={handleNewAlbum}>
                                    {t.home.discoverAlbum}
                                </Button>
                            </div>
                            {
                                focusAlbum && (
                                    <FocusAlbumCard
                                        album={focusAlbum}
                                        listenEvents={listenEvents}
                                        onLogListen={() =>
                                            handleLogListen(focusAlbum.id)
                                        }
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
                                onArchive={setArchiveAlbumId}
                                onDelete={setDeleteAlbumId}
                                onEdit={setEditingAlbumId}
                                onLogListen={handleLogListen}
                                onReconsider={setArchiveReturnAlbumId}
                                onSetFocus={setFocusAlbumId}
                            />
                            <BackupControls
                                adapter={adapter}
                                onRestored={() => window.location.reload()}
                            />
                        </>
                    )
            }
            <DiscoverAlbumDialog
                open={dialogOpen}
                album={album}
                setAlbum={setAlbum}
                onClose={() => setDialogOpen(false)}
                onFinish={handleFinish}
            />
            {
                editingAlbum && (
                    <EditAlbumDialog
                        key={editingAlbum.id}
                        album={editingAlbum}
                        onClose={() => setEditingAlbumId(null)}
                        onSave={updateAlbum}
                        onUpdateCoverOverride={updateAlbumCoverOverride}
                        onSetCoverUrlOverride={setCoverUrlOverride}
                        onRemoveCoverOverride={removeAlbumCoverOverride}
                    />
                )
            }
            <DeleteAlbumDialog
                album={deleteAlbumData}
                onCancel={() => setDeleteAlbumId(null)}
                onConfirm={handleDeleteAlbum}
            />
            <Dialog open={reflectionAlbum !== undefined}>
                {
                    reflectionAlbum && (
                        <>
                            <AlbumCoach
                                key={`${reflectionAlbum.id}-${reflectionAlbum.roleHistory.length}`}
                                albumTitle={reflectionAlbum.title}
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
