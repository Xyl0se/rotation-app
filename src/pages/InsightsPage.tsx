import { useState } from "react"

import AlbumCoach from "../components/features/album-coach/AlbumCoach"
import ArchiveReturnCoach from "../components/features/archive/ArchiveReturnCoach"
import InsightsPanel from "../components/features/insights/InsightsPanel"
import ReflectionCard from "../components/features/reflection/ReflectionCard"
import RoleOverviewPanel from "../components/features/rotation-dashboard/RoleOverviewPanel"
import Button from "../components/ui/Button"
import Dialog from "../components/ui/Dialog"
import { useConnection } from "../contexts/connectionState"
import { evaluateReflection } from "../domain/reflection/evaluateReflection"
import type { RoleId } from "../domain/roles"
import { useLibrary } from "../hooks/useLibrary"
import { useI18n } from "../i18n/useI18n"

export default function InsightsPage() {
    const { t } = useI18n()
    const { isOnline, apiReachable } = useConnection()
    const serverConnected = isOnline && apiReachable === true
    const { albums, isLoading, libraryError, refresh, updateAlbumRole } = useLibrary(serverConnected)
    const [reflectionAlbumId, setReflectionAlbumId] = useState<string | null>(null)
    const [archiveReturnAlbumId, setArchiveReturnAlbumId] = useState<string | null>(null)

    const reflectionPrompt = evaluateReflection(albums).prompts[0]
    const reflectionAlbum = albums.find(album => album.id === reflectionAlbumId)
    const archiveReturnAlbum = albums.find(album => album.id === archiveReturnAlbumId)

    async function handleReflectionComplete(role: RoleId) {
        if (!reflectionAlbumId) return
        if (await updateAlbumRole(reflectionAlbumId, role, "reflection")) {
            setReflectionAlbumId(null)
        }
    }

    async function handleArchiveReturnComplete(role: RoleId) {
        if (!archiveReturnAlbumId) return
        if (await updateAlbumRole(archiveReturnAlbumId, role, "reflection")) {
            setArchiveReturnAlbumId(null)
        }
    }

    function handleReflect() {
        if (!reflectionPrompt) return
        if (reflectionPrompt.code === "archive-return-candidate") {
            setArchiveReturnAlbumId(reflectionPrompt.album.id)
        } else {
            setReflectionAlbumId(reflectionPrompt.album.id)
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
                        <ReflectionCard prompt={reflectionPrompt} onReflect={handleReflect} />
                    </section>
                    <InsightsPanel albums={albums} />
                    <section aria-labelledby="roles-heading">
                        <h2 id="roles-heading">{t.dashboard.roleOverview}</h2>
                        <RoleOverviewPanel albums={albums} />
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
        </main>
    )
}
