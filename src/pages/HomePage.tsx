import { useState } from "react"

import { useLibrary } from "../hooks/useLibrary"
import { useRotationPlan } from "../hooks/useRotationPlan"
import { useListenEvents } from "../hooks/useListenEvents"
import { useBindings } from "../hooks/useBindings"
import { useConnection } from "../contexts/connectionState"

import FocusAlbumCard from "../components/features/focus-album/FocusAlbumCard"
import EmptyFocusAlbumCard from "../components/features/focus-album/EmptyFocusAlbumCard"
import PlayerRotation from "../components/features/player-rotation/PlayerRotation"
import Button from "../components/ui/Button"
import EditAlbumDialog from "../components/features/library/EditAlbumDialog"
import ListeningJournalEditor from "../components/features/listening/ListeningJournalEditor"
import AlbumDetailPage from "./AlbumDetailPage"

import { useI18n } from "../i18n/useI18n"

interface HomePageProps {
    onNavigateToBindings?: () => void
    albumDetailId?: string | null
    onOpenAlbum?: (albumId: string) => void
    onCloseAlbum?: () => void
}

function HomePage({ albumDetailId = null, onOpenAlbum, onCloseAlbum }: HomePageProps) {
    const { t } = useI18n()
    const [editingAlbumId, setEditingAlbumId] = useState<string | null>(null)
    const [journalEditorEventId, setJournalEditorEventId] = useState<string | null>(null)

    const { isOnline, apiReachable } = useConnection()
    const serverConnected = isOnline && apiReachable === true

    const {
        albums,
        isLoading: isLibraryLoading,
        libraryError,
        refresh: refreshLibrary,
        updateAlbum,
        updateAlbumSources,
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

    async function handleLogListen(id: string) {
        const event = await logListen(id)
        if (event) {
            setJournalEditorEventId(event.id)
            await refreshLibrary()
        }
    }

    const focusAlbum = albums.find(album => album.id === focusAlbumId)
    const editingAlbum = albums.find(album => album.id === editingAlbumId)
    const journalEditorEvent = listenEvents.find(event => event.id === journalEditorEventId) ?? null
    const journalEditorAlbum = albums.find(album => album.id === journalEditorEvent?.albumId)
    const detailAlbum = albums.find(album => album.id === albumDetailId)

    const detailView = albumDetailId ? (
        <AlbumDetailPage
            albumId={albumDetailId}
            album={detailAlbum}
            listenEvents={listenEvents}
            reflections={[]}
            currentRotation={rotationPlan}
            historicRotations={[]}
            binding={getBindingForLibraryAlbum(albumDetailId)}
            isLoading={isLibraryLoading || bindingsLoading || isRotationLoading || isListenLoading}
            partialErrors={[libraryError, listenError, rotationError, bindingsError].filter((value): value is string => Boolean(value))}
            onBack={() => onCloseAlbum?.()}
            onEdit={() => setEditingAlbumId(albumDetailId)}
            onLogListen={() => void handleLogListen(albumDetailId)}
            onSaveSources={(sources) => updateAlbumSources(albumDetailId, sources)}
        />
    ) : null

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
                {albums.length === 0 ? (
                    <div className="empty-state">
                        <p>{t.emptyLibrary.title}</p>
                        <p>{t.emptyLibrary.description}</p>
                    </div>
                ) : (
                    <>
                        {focusAlbum ? (
                            <FocusAlbumCard
                                album={focusAlbum}
                                onLogListen={() => void handleLogListen(focusAlbum.id)}
                                onSuggestAnother={() => void suggestFocusAlbum()}
                                onEdit={() => setEditingAlbumId(focusAlbum.id)}
                                onOpenAlbum={onOpenAlbum}
                            />
                        ) : (
                            <EmptyFocusAlbumCard
                                hasActiveRotation={rotationPlan?.status === "active" && rotationPlan.items.length > 0}
                                onSuggest={() => void suggestFocusAlbum()}
                            />
                        )}
                        <PlayerRotation
                            albums={albums}
                            plan={rotationPlan}
                            listenEvents={listenEvents}
                            onGenerate={generatePlan}
                            onRemove={removeFromPlan}
                            onReplace={replaceAlbum}
                            onAccept={acceptPlan}
                            onGetReplacementCandidates={getReplacementCandidates}
                            onOpenAlbum={onOpenAlbum}
                        />
                    </>
                )}
            </main>}
            {editingAlbum && (
                <EditAlbumDialog
                    key={editingAlbum.id}
                    album={editingAlbum}
                    binding={getBindingForLibraryAlbum(editingAlbum.id)}
                    onClose={() => setEditingAlbumId(null)}
                    onSave={updateAlbum}
                    onUpdateCoverOverride={updateAlbumCoverOverride}
                    onRemoveCoverOverride={removeAlbumCoverOverride}
                    onRetryCover={retryAlbumCover}
                    listenEvents={listenEvents}
                    onEditJournal={(eventId: string) => {
                        setEditingAlbumId(null)
                        setJournalEditorEventId(eventId)
                    }}
                />
            )}
            <ListeningJournalEditor
                key={journalEditorEvent?.id ?? "closed-journal"}
                event={journalEditorEvent}
                album={journalEditorAlbum}
                onClose={() => setJournalEditorEventId(null)}
                onSave={saveJournal}
                onDelete={deleteJournal}
            />
        </>
    )
}

export default HomePage
