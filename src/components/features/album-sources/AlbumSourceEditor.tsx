import { useState } from "react"
import type { Album, AlbumSource } from "../../../types/album"
import { previewAlbumSources, searchAlbumSources, type MusicBrainzReleaseCandidate } from "../../../services/api/albumsService"
import Button from "../../ui/Button"
import { useI18n } from "../../../i18n/useI18n"

export default function AlbumSourceEditor({ album, onSave }: { album: Album; onSave: (sources: AlbumSource[]) => Promise<boolean> }) {
    const { t } = useI18n()
    const [sources, setSources] = useState<AlbumSource[]>(album.sources ?? [])
    const [candidates, setCandidates] = useState<MusicBrainzReleaseCandidate[]>([])
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [saved, setSaved] = useState(false)

    async function search() {
        setBusy(true); setError(null); setSaved(false)
        try { setCandidates((await searchAlbumSources(album.id)).candidates) }
        catch (cause) { setError(cause instanceof Error ? cause.message : t.albumSources.error) }
        finally { setBusy(false) }
    }

    async function review(candidate: MusicBrainzReleaseCandidate) {
        setBusy(true); setError(null)
        try { setSources((await previewAlbumSources(album.id, candidate)).sources); setCandidates([]) }
        catch (cause) { setError(cause instanceof Error ? cause.message : t.albumSources.error) }
        finally { setBusy(false) }
    }

    async function save() {
        setBusy(true); setError(null); setSaved(false)
        if (await onSave(sources)) setSaved(true)
        else setError(t.albumSources.error)
        setBusy(false)
    }

    return <section className="album-detail-panel album-source-editor">
        <h2>{t.albumSources.title}</h2>
        <p>{t.albumSources.description}</p>
        {sources.length === 0 && <p className="album-detail-empty">{t.albumSources.empty}</p>}
        {sources.map((source, index) => <div className="album-source-edit-row" key={`${source.provider}-${source.externalId ?? index}`}>
            <label><span>{t.albumSources.provider}</span><strong>{t.albumSources.providers[source.provider]}</strong></label>
            <label><span>{t.albumSources.url}</span><input value={source.url ?? ""} onChange={event => setSources(current => current.map((item, itemIndex) => itemIndex === index ? { ...item, url: event.target.value || undefined } : item))} /></label>
            <button type="button" onClick={() => setSources(current => current.filter((_, itemIndex) => itemIndex !== index))}>{t.albumSources.remove}</button>
        </div>)}
        {candidates.length > 0 && <div className="album-source-candidates"><h3>{t.albumSources.matches}</h3>{candidates.map(candidate => <button type="button" key={candidate.releaseId} onClick={() => void review(candidate)}><strong>{candidate.title}</strong><span>{candidate.artist}{candidate.year ? ` · ${candidate.year}` : ""}</span></button>)}</div>}
        {candidates.length === 0 && !busy && <p className="album-detail-empty">{t.albumSources.noMatches}</p>}
        {error && <p className="sync-status sync-status--warning" role="alert">{error}</p>}
        {saved && <p className="sync-status" role="status">{t.albumSources.saved}</p>}
        <div className="album-detail-actions"><Button variant="secondary" disabled={busy} onClick={() => void search()}>{busy ? t.albumSources.working : t.albumSources.find}</Button><Button disabled={busy} onClick={() => void save()}>{t.albumSources.save}</Button></div>
    </section>
}
