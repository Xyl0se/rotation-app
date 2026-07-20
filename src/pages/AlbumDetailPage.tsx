import type { Album } from "../types/album"
import type { ListenEvent } from "../domain/listening/listenEvents"
import type { RotationPlan } from "../domain/rotation-plan/rotationPlan"
import type { Binding } from "../services/api/bindingsService"
import type { ReflectionInboxItem } from "../services/api/reflectionService"

import AlbumCover from "../components/ui/AlbumCover"
import AlbumTimeline from "../components/features/timeline/AlbumTimeline"
import Button from "../components/ui/Button"
import { useI18n } from "../i18n/useI18n"
import AlbumSourceEditor from "../components/features/album-sources/AlbumSourceEditor"
import type { AlbumSource } from "../types/album"
import AlbumExternalSources from "../components/features/album-sources/AlbumExternalSources"
import AlbumPlayer from "../components/features/playback/AlbumPlayer"

interface AlbumDetailPageProps {
    album?: Album
    albumId: string
    listenEvents: ListenEvent[]
    reflections: ReflectionInboxItem[]
    currentRotation: RotationPlan | null
    historicRotations: RotationPlan[]
    binding?: Binding
    isLoading: boolean
    partialErrors: string[]
    onBack: () => void
    onEdit: () => void
    onLogListen: () => void
    onSaveSources: (sources: AlbumSource[]) => Promise<boolean>
}

const formatDate = (value: string) => new Date(value).toLocaleDateString(undefined, { day: "2-digit", month: "2-digit", year: "numeric" })

export default function AlbumDetailPage({ album, albumId, listenEvents, reflections, currentRotation, historicRotations, binding, isLoading, partialErrors, onBack, onEdit, onLogListen, onSaveSources }: AlbumDetailPageProps) {
    const { t } = useI18n()

    if (isLoading && !album) return <main className="container album-detail"><p role="status">{t.albumDetail.loading}</p></main>
    if (!album) return <main className="container album-detail"><button className="album-detail-back" onClick={onBack}>{t.albumDetail.back}</button><div className="album-detail-state" role="alert"><h1>{t.albumDetail.notFoundTitle}</h1><p>{t.albumDetail.notFound(albumId)}</p></div></main>

    const albumListens = listenEvents.filter(event => event.albumId === album.id)
    const albumReflections = reflections.filter(item => item.albumId === album.id)
    const inCurrentRotation = currentRotation?.albumIds.includes(album.id) ?? false
    const role = album.category ? t.roles[album.category] : null

    return <main className="container album-detail">
        <button className="album-detail-back" onClick={onBack}>{t.albumDetail.back}</button>
        {isLoading && <p className="sync-status" role="status">{t.albumDetail.loadingRelated}</p>}
        {partialErrors.length > 0 && <aside className="sync-status sync-status--warning" role="status"><strong>{t.albumDetail.partialTitle}</strong><span>{t.albumDetail.partialDescription}</span></aside>}
        <header className="album-detail-hero">
            <AlbumCover coverUrl={album.coverUrl} coverOverride={album.coverOverride} albumId={album.id} title={album.title} alt={t.common.coverOf(album.title)} className="album-detail-cover" />
            <div><p className="album-detail-kicker">{t.albumDetail.kicker}</p><h1>{album.title}</h1><p className="album-detail-artist">{album.artist}</p><p>{album.year || t.albumDetail.unknownYear}</p>{role && <span className={`album-role-label role-${album.category}`}>{role.title}</span>}
                <div className="album-detail-actions"><Button onClick={onLogListen}>{t.albumDetail.listened}</Button><Button variant="secondary" onClick={onEdit}>{t.albumDetail.edit}</Button></div>
                <AlbumPlayer albumId={albumId} albumTitle={album.title} bindingConfirmed={binding?.state === "confirmed"} />
            </div>
        </header>

        <div className="album-detail-grid">
            <section className="album-detail-panel"><h2>{t.albumDetail.story.title}</h2>{album.story ? <dl>
                {album.story.acquiredBecause && <><dt>{t.albumStory.why}</dt><dd>{t.acquisitionReasons[album.story.acquiredBecause]}</dd></>}
                {album.story.lifePhase && <><dt>{t.albumStory.when}</dt><dd>{t.lifePhases[album.story.lifePhase]}</dd></>}
                {album.story.memoryNote && <><dt>{t.albumDetail.story.memory}</dt><dd className="album-detail-memory">{album.story.memoryNote}</dd></>}
            </dl> : <p className="album-detail-empty">{t.albumDetail.story.empty}</p>}</section>

            <section className="album-detail-panel"><h2>{t.albumDetail.roleHistory.title}</h2>{album.roleHistory.length ? <ol className="album-detail-list">{[...album.roleHistory].reverse().map((entry, index) => <li key={`${entry.recordedAt}-${index}`}><strong>{t.roles[entry.role].title}</strong><span>{formatDate(entry.recordedAt)} · {t.albumDetail.roleHistory.source[entry.source]}</span></li>)}</ol> : <p className="album-detail-empty">{t.albumDetail.roleHistory.empty}</p>}</section>

            <section className="album-detail-panel"><h2>{t.albumDetail.listening.title}</h2><p>{t.albumDetail.listening.summary(albumListens.length)}</p>{albumListens.length === 0 && <p className="album-detail-empty">{t.albumDetail.listening.empty}</p>}</section>

            <section className="album-detail-panel"><h2>{t.albumDetail.reflections.title}</h2>{albumReflections.length ? <ul className="album-detail-list">{albumReflections.map(item => <li key={item.id}><strong>{t.albumDetail.reflections.rules[item.ruleCode]}</strong><span>{t.albumDetail.reflections.state[item.state]}</span></li>)}</ul> : <p className="album-detail-empty">{t.albumDetail.reflections.empty}</p>}</section>

            <section className="album-detail-panel"><h2>{t.albumDetail.rotation.title}</h2>{inCurrentRotation && <p>{t.albumDetail.rotation.current(currentRotation?.name ?? "")}</p>}{historicRotations.length > 0 && <details><summary>{t.albumDetail.rotation.history(historicRotations.length)}</summary><ul>{historicRotations.map(plan => <li key={plan.id}>{plan.name} · {formatDate(plan.archivedAt ?? plan.acceptedAt ?? plan.createdAt)}</li>)}</ul></details>}{!inCurrentRotation && historicRotations.length === 0 && <p className="album-detail-empty">{t.albumDetail.rotation.empty}</p>}</section>

            <section className="album-detail-panel"><h2>{t.albumDetail.binding.title}</h2>{binding ? <dl><dt>{t.albumDetail.binding.stateLabel}</dt><dd>{t.albumDetail.binding.states[binding.state]}</dd><dt>{t.albumDetail.binding.folder}</dt><dd>{binding.relativePath}</dd>{!binding.folderExists && <><dt>{t.albumDetail.binding.availability}</dt><dd>{t.albumDetail.binding.missing}</dd></>}</dl> : <p className="album-detail-empty">{t.albumDetail.binding.empty}</p>}</section>
            <AlbumExternalSources sources={album.sources ?? []} />
            <details className="album-source-management"><summary>{t.albumSources.manage}</summary><AlbumSourceEditor album={album} onSave={onSaveSources} /></details>
        </div>
        <AlbumTimeline album={album} listenEvents={albumListens} />
    </main>
}
