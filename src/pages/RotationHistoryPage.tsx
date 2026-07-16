import { useEffect, useState } from "react"
import { createDraftFromHistory, fetchRotationHistory, type RotationHistoryResponse } from "../services/api/rotationStateService"
import { formatFileSize } from "../utils/formatFileSize"
import { useI18n } from "../i18n/useI18n"
import Button from "../components/ui/Button"

export default function RotationHistoryPage() {
    const { t } = useI18n()
    const [data, setData] = useState<RotationHistoryResponse | null>(null)
    const [offset, setOffset] = useState(0)
    const [error, setError] = useState<string | null>(null)
    const limit = 10
    useEffect(() => { queueMicrotask(() => void fetchRotationHistory(limit, offset).then(result => { setData(result); setError(null) }).catch(cause => setError(cause instanceof Error ? cause.message : t.history.loadError))) }, [offset, t.history.loadError])
    return <main className="container rotation-history"><h1>{t.history.title}</h1><p>{t.history.description}</p>
        {error && <div className="sync-status sync-status--warning">{error}</div>}
        {data?.items.length === 0 && <p>{t.history.empty}</p>}
        {data?.items.map(plan => <article className="card" key={plan.id}><h2>{plan.name}</h2><p>{t.history.archivedAt(plan.archivedAt ?? plan.acceptedAt ?? plan.createdAt)}</p><p>{t.history.albumCount(plan.items.length)}</p><ul>{plan.items.map(item => <li key={item.albumId}>{item.albumArtistSnapshot} — {item.albumTitleSnapshot}</li>)}</ul>
            <h3>{t.history.exports}</h3>{plan.exports?.length ? <ul>{plan.exports.map(operation=><li key={operation.id}>{t.history.exportedAt(operation.appliedAt)} · {operation.fileCount ?? 0} {t.exportPage.files} · {formatFileSize(operation.totalSizeBytes ?? 0)}</li>)}</ul>:<p>{t.history.noExport}</p>}
            <Button variant="secondary" onClick={async()=>{try{await createDraftFromHistory(plan.id);setError(null)}catch(cause){setError(cause instanceof Error?cause.message:t.history.draftError)}}}>{t.history.useAsDraft}</Button>
        </article>)}
        {data && <div className="player-rotation-actions"><Button variant="secondary" disabled={offset===0} onClick={() => setOffset(Math.max(0,offset-limit))}>{t.history.previous}</Button><Button variant="secondary" disabled={offset+limit>=data.total} onClick={() => setOffset(offset+limit)}>{t.history.next}</Button></div>}
    </main>
}
