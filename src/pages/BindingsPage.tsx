import { useState, useEffect, useCallback } from "react"
import {
    fetchBindings,
    confirmBinding,
    deleteBinding,
    verifyBindings,
    reconcileBindings,
    captureBinding,
    fetchBindingCandidates,
    selectBindingCandidate,
    rejectBindingCandidates,
    selectBindingLibraryAlbum,
    type Binding,
    type BindingCandidate,
    type VerifyResult,
    type ReconcileResult,
} from "../services/api/bindingsService.js"
import { getApiErrorMessage } from "../services/api/apiClient.js"
import { useI18n } from "../i18n/useI18n.js"
import { useToast } from "../hooks/useToast.js"
import Button from "../components/ui/Button.js"
import Card from "../components/ui/Card.js"
import DiagnosticsPanel from "../components/features/diagnostics/DiagnosticsPanel.js"
import DiscoverAlbumDialog from "../components/features/discover-album/DiscoverAlbumDialog.js"
import AlbumCoach from "../components/features/album-coach/AlbumCoach.js"
import Dialog from "../components/ui/Dialog.js"
import type { Album } from "../types/album.js"
import type { RoleId } from "../domain/roles.js"
import type { ArchiveReason } from "../domain/album/roleHistory.js"
import { generateUUID } from "../utils/uuid.js"
import { getScanProgress, triggerScan } from "../services/api/scanService.js"
import { updateAlbum } from "../services/api/albumsService.js"
import { fetchAlbums } from "../services/api/albumsService.js"

function makeEmptyAlbum(): Album {
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

interface BindingsPageProps {
    onNavigateToLibrary?: (albumId: string) => void
    onBindingsChanged?: () => void
}

export default function BindingsPage({ onNavigateToLibrary, onBindingsChanged }: BindingsPageProps) {
    const { t } = useI18n()
    const toast = useToast()
    const [bindings, setBindings] = useState<Binding[]>([])
    const [filter, setFilter] = useState<"unresolved"|"all" | "proposed" | "confirmed" | "missing">("unresolved")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [processingId, setProcessingId] = useState<string | null>(null)
    const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null)
    const [reconcileResult, setReconcileResult] = useState<ReconcileResult | null>(null)
    const [captureAlbum, setCaptureAlbum] = useState<Album>(() => makeEmptyAlbum())
    const [captureBindingId, setCaptureBindingId] = useState<string | null>(null)
    const [showCaptureDialog, setShowCaptureDialog] = useState(false)
    const [scanning, setScanning] = useState(false)
    const [scanProgress, setScanProgress] = useState<{
        directoriesScanned: number
        directoriesSkipped: number
    } | null>(null)
    const [coachingAlbum, setCoachingAlbum] = useState<Album | null>(null)
    const [candidateLists, setCandidateLists] = useState<Record<string, BindingCandidate[]>>({})
    const [candidateLoadingId, setCandidateLoadingId] = useState<string | null>(null)
    const [libraryAlbums, setLibraryAlbums] = useState<Album[]>([])
    const [manualSearch, setManualSearch] = useState<Record<string, string>>({})
    const [resolutionBindingId,setResolutionBindingId]=useState<string|null>(null)

    const load = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const state = filter === "all"||filter === "unresolved" ? undefined : filter
            const response = await fetchBindings(state)
            if(filter==="unresolved"){
                const unresolved=response.bindings.filter(binding=>!binding.libraryExists)
                setBindings(unresolved.length?unresolved:response.bindings)
                if(unresolved.length===0)setFilter("all")
            }else setBindings(response.bindings)
            onBindingsChanged?.()
        } catch (e) {
            setError(getApiErrorMessage(e))
        } finally {
            setLoading(false)
        }
    }, [filter, onBindingsChanged])

    useEffect(() => {
        void Promise.resolve().then(load)
    }, [load])

    async function handleConfirm(albumId: string) {
        setProcessingId(albumId)
        try {
            await confirmBinding(albumId)
            await load()
        } catch (e) {
            setError(getApiErrorMessage(e))
        } finally {
            setProcessingId(null)
        }
    }

    async function handleDelete(albumId: string) {
        if (!confirm(t.bindings.confirmDelete)) return
        setProcessingId(albumId)
        try {
            await deleteBinding(albumId)
            await load()
        } catch {
            setError(t.bindings.error)
        } finally {
            setProcessingId(null)
        }
    }

    async function handleReviewCandidates(albumId: string) {
        setCandidateLoadingId(albumId)
        try {
            const result = await fetchBindingCandidates(albumId)
            setCandidateLists(previous => ({ ...previous, [albumId]: result.candidates }))
            if (libraryAlbums.length === 0) setLibraryAlbums(await fetchAlbums())
        } catch (e) {
            setError(getApiErrorMessage(e))
        } finally {
            setCandidateLoadingId(null)
        }
    }

    async function handleManualSelect(albumId: string, libraryAlbumId: string) {
        setProcessingId(albumId)
        try {
            await selectBindingLibraryAlbum(albumId, libraryAlbumId)
            setResolutionBindingId(null)
            await load()
        } catch (e) {
            setError(getApiErrorMessage(e))
        } finally {
            setProcessingId(null)
        }
    }

    async function handleSelectCandidate(albumId: string, candidate: BindingCandidate) {
        setProcessingId(albumId)
        try {
            await selectBindingCandidate(albumId, candidate.libraryAlbumId, candidate.scanId)
            setResolutionBindingId(null)
            setCandidateLists(previous => ({ ...previous, [albumId]: [] }))
            await load()
        } catch (e) {
            setError(getApiErrorMessage(e))
        } finally {
            setProcessingId(null)
        }
    }

    async function handleRejectCandidates(albumId: string) {
        await rejectBindingCandidates(albumId)
        setCandidateLists(previous => ({ ...previous, [albumId]: [] }))
    }

    async function handleVerify() {
        setLoading(true)
        setVerifyResult(null)
        setReconcileResult(null)
        try {
            const result = await verifyBindings()
            setVerifyResult(result)
            if (result.missingCount > 0) {
                await load()
            }
        } catch (e) {
            setError(getApiErrorMessage(e))
        } finally {
            setLoading(false)
        }
    }

    async function handleReconcile() {
        setLoading(true)
        setVerifyResult(null)
        setReconcileResult(null)
        try {
            const result = await reconcileBindings()
            setReconcileResult(result)
            if (result.promotedCount > 0) {
                await load()
            }
        } catch (e) {
            setError(getApiErrorMessage(e))
        } finally {
            setLoading(false)
        }
    }

    async function handleScan() {
        setScanning(true)
        setScanProgress(null)
        setError(null)
        try {
            const { scanId } = await triggerScan()
            for (let attempt = 0; attempt < 60; attempt += 1) {
                const progress = await getScanProgress(scanId)
                setScanProgress({
                    directoriesScanned: progress.directoriesScanned,
                    directoriesSkipped: progress.directoriesSkipped,
                })
                if (progress.status === "completed") {
                    await load()
                    toast.success(t.bindings.scanSuccess)
                    return
                }
                if (progress.status === "failed") {
                    throw new Error(t.bindings.scanFailed)
                }
                await new Promise(resolve => setTimeout(resolve, 1000))
            }
            throw new Error(t.bindings.scanTimeout)
        } catch (e) {
            const message = getApiErrorMessage(e)
            setError(message)
            toast.error(message)
        } finally {
            setScanning(false)
            setScanProgress(null)
        }
    }

    function handleStartCapture(binding: Binding) {
        setResolutionBindingId(null)
        setCaptureBindingId(binding.albumId)
        setCaptureAlbum(makeEmptyAlbum())
        setShowCaptureDialog(true)
    }

    async function handleOpenResolution(binding:Binding){
        setResolutionBindingId(binding.albumId)
        await handleReviewCandidates(binding.albumId)
    }

    async function handleCaptureFinish(album: Album, coverCandidates: string[] = []) {
        if (!captureBindingId) return
        try {
            const captured = await captureBinding(captureBindingId, album, coverCandidates)
            toast.success(t.bindings.captureSuccess)
            setShowCaptureDialog(false)
            setCaptureAlbum(makeEmptyAlbum())
            setCaptureBindingId(null)
            setCoachingAlbum(captured.album)
            await load()
        } catch (e) {
            toast.error(getApiErrorMessage(e))
        }
    }

    async function handleCaptureCoachComplete(role: RoleId, archiveReason?:ArchiveReason) {
        if (!coachingAlbum) return
        try {
            await updateAlbum({
                ...coachingAlbum,
                category: role,
                roleHistory: [...coachingAlbum.roleHistory, {
                    role,
                    recordedAt: new Date().toISOString(),
                    source: "coach",
                    ...(role === "archive" && archiveReason ? { archiveReason } : {}),
                }],
            })
            toast.success(t.bindings.coachSuccess)
            setCoachingAlbum(null)
        } catch (e) {
            toast.error(getApiErrorMessage(e))
        }
    }

    const capturePrefill = (() => {
        const binding = bindings.find(b => b.albumId === captureBindingId)
        if (!binding) return undefined
        return {
            title: binding.suggestedTitle,
            artist: binding.suggestedArtist,
        }
    })()
    const resolutionBinding=bindings.find(binding=>binding.albumId===resolutionBindingId)

    return (
        <div className="bindings-page">
            <DiagnosticsPanel />

            <h1 className="bindings-title">{t.bindings.title}</h1>

            <div className="bindings-actions">
                <Button
                    onClick={handleScan}
                    disabled={scanning || loading}
                    title={t.bindings.scanTooltip}
                >
                    {scanning ? t.bindings.scanning : t.bindings.scanNow}
                </Button>
                <Button
                    variant="secondary"
                    onClick={handleVerify}
                    disabled={loading}
                    title={t.bindings.verifyTooltip}
                >
                    {t.bindings.verify}
                </Button>
                <Button
                    variant="secondary"
                    onClick={handleReconcile}
                    disabled={loading}
                    title={t.bindings.reconcileTooltip}
                >
                    {t.bindings.reconcile}
                </Button>
            </div>

            {scanning && scanProgress && (
                <div className="bindings-result bindings-result--scan">
                    {t.bindings.scanProgress(
                        scanProgress.directoriesScanned,
                        scanProgress.directoriesSkipped,
                    )}
                </div>
            )}

            {verifyResult && (
                <div className="bindings-result bindings-result--verify">
                    {t.bindings.verifyResult(verifyResult.okCount, verifyResult.missingCount)}
                </div>
            )}
            {reconcileResult && (
                <div className="bindings-result bindings-result--reconcile">
                    {t.bindings.reconcileResult(reconcileResult.promotedCount)}
                </div>
            )}

            <div className="bindings-filters">
                {(["unresolved","all", "proposed", "confirmed", "missing"] as const).map((f) => (
                    <button
                        key={f}
                        className={`bindings-filter ${filter === f ? "active" : ""}`}
                        onClick={() => setFilter(f)}
                    >
                        {t.bindings.filters[f]}
                    </button>
                ))}
            </div>

            {error && <div className="bindings-error">{error}</div>}
            {loading && <div className="bindings-loading">{t.common.loading}</div>}

            {!loading && bindings.length === 0 && (
                <p className="bindings-empty">{t.bindings.empty}</p>
            )}

            {showCaptureDialog && (
                <DiscoverAlbumDialog
                    open={showCaptureDialog}
                    onClose={() => {
                        setShowCaptureDialog(false)
                        setCaptureBindingId(null)
                    }}
                    onFinish={handleCaptureFinish}
                    album={captureAlbum}
                    setAlbum={setCaptureAlbum}
                    prefill={capturePrefill}
                />
            )}

            <Dialog open={resolutionBinding!==undefined} ariaLabel={t.bindings.resolver.title}>
                {resolutionBinding&&<section className="binding-resolver"><p className="binding-column-label">{t.bindings.resolver.kicker}</p><h2>{resolutionBinding.suggestedArtist} — {resolutionBinding.suggestedTitle}</h2><code>{resolutionBinding.relativePath}</code><p>{t.bindings.resolver.description}</p>
                    {candidateLoadingId===resolutionBinding.albumId?<p>{t.common.loading}</p>:<div className="binding-resolver-candidates">{(candidateLists[resolutionBinding.albumId]??[]).map(candidate=><button key={candidate.libraryAlbumId} onClick={()=>void handleSelectCandidate(resolutionBinding.albumId,candidate)}><strong>{candidate.artist} — {candidate.title}</strong><span>{t.bindings.candidates.confidence[candidate.confidence]}</span></button>)}</div>}
                    <label className="binding-manual-search"><span>{t.bindings.candidates.manual}</span><input value={manualSearch[resolutionBinding.albumId]??""} onChange={event=>setManualSearch(previous=>({...previous,[resolutionBinding.albumId]:event.target.value}))} placeholder={t.bindings.candidates.searchPlaceholder}/></label>
                    {(manualSearch[resolutionBinding.albumId]?.trim().length??0)>1&&<div className="binding-manual-results">{libraryAlbums.filter(album=>`${album.artist} ${album.title}`.toLocaleLowerCase().includes(manualSearch[resolutionBinding.albumId]!.trim().toLocaleLowerCase())).slice(0,5).map(album=><button key={album.id} onClick={()=>void handleManualSelect(resolutionBinding.albumId,album.id)}>{album.artist} — {album.title}</button>)}</div>}
                    <div className="dialog-actions"><Button variant="secondary" onClick={()=>setResolutionBindingId(null)}>{t.bindings.resolver.cancel}</Button><Button onClick={()=>handleStartCapture(resolutionBinding)}>{t.bindings.resolver.create}</Button></div>
                </section>}
            </Dialog>

            <Dialog open={coachingAlbum !== null}>
                {coachingAlbum && (
                    <AlbumCoach
                        key={coachingAlbum.id}
                        albumTitle={coachingAlbum.title}
                        album={coachingAlbum}
                        onComplete={handleCaptureCoachComplete}
                    />
                )}
            </Dialog>

            <div className="bindings-list">
                {bindings.map((b) => (
                    <Card key={b.albumId} className="binding-card">
                        {!b.libraryExists?(
                            <>
                                <button className="binding-card-trigger" onClick={()=>void handleOpenResolution(b)} disabled={processingId===b.albumId}>
                                    <span><span className="binding-column-label">{t.bindings.sourceFolder}</span><strong>{b.suggestedArtist} — {b.suggestedTitle}</strong><code className="binding-path">{b.relativePath}</code></span><span className="binding-card-trigger-action">{t.bindings.resolver.open} →</span>
                                </button>
                                {(b.state==="missing"||!b.folderExists)&&<div className="binding-card-maintenance"><span className="binding-missing">{t.bindings.folderMissing}</span><Button variant="secondary" onClick={()=>void handleDelete(b.albumId)} disabled={processingId===b.albumId}>{t.bindings.delete}</Button></div>}
                            </>
                        ):(
                        <div className="binding-row">
                            <section className="binding-source">
                                <span className="binding-column-label">{t.bindings.sourceFolder}</span>
                                {b.albumTitle && b.albumArtist ? (
                                    <span className="binding-preview">
                                        {t.bindings.albumPreview(b.albumTitle, b.albumArtist)}
                                    </span>
                                ) : null}
                                <code className="binding-path">{b.relativePath}</code>
                            </section>

                            <section className="binding-resolution">
                                <span className="binding-column-label">{t.bindings.resolution}</span>
                                <div className="binding-statuses">
                                    <span className={`binding-state binding-state--${b.state}`}>
                                        {t.bindings.state[b.state]}
                                    </span>
                                    {!b.libraryExists && (
                                        <span className="binding-orphan">{t.bindings.orphanBadge}</span>
                                    )}
                                    {!b.folderExists && (
                                        <span className="binding-missing">{t.bindings.folderMissing}</span>
                                    )}
                                </div>
                                {candidateLists[b.albumId] && (
                                    <div className="binding-candidates">
                                        {candidateLists[b.albumId].length === 0 ? (
                                            <span>{t.bindings.candidates.none}</span>
                                        ) : candidateLists[b.albumId].map(candidate => (
                                            <div className="binding-candidate" key={candidate.libraryAlbumId}>
                                                <div>
                                                    <strong>{candidate.artist} — {candidate.title}</strong>
                                                    <span>{t.bindings.candidates.confidence[candidate.confidence]}</span>
                                                    <small>{candidate.reasons.map(reason => t.bindings.candidates.reasons[reason]).join(" · ")}</small>
                                                </div>
                                                <Button onClick={() => handleSelectCandidate(b.albumId, candidate)}>
                                                    {t.bindings.candidates.select}
                                                </Button>
                                            </div>
                                        ))}
                                        {candidateLists[b.albumId].length > 0 && (
                                            <button className="binding-candidates-reject" onClick={() => void handleRejectCandidates(b.albumId)}>
                                                {t.bindings.candidates.reject}
                                            </button>
                                        )}
                                        <label className="binding-manual-search">
                                            <span>{t.bindings.candidates.manual}</span>
                                            <input
                                                value={manualSearch[b.albumId] ?? ""}
                                                onChange={event => setManualSearch(previous => ({ ...previous, [b.albumId]: event.target.value }))}
                                                placeholder={t.bindings.candidates.searchPlaceholder}
                                            />
                                        </label>
                                        {(manualSearch[b.albumId]?.trim().length ?? 0) > 1 && (
                                            <div className="binding-manual-results">
                                                {libraryAlbums.filter(album =>
                                                    `${album.artist} ${album.title}`.toLocaleLowerCase().includes(manualSearch[b.albumId]!.trim().toLocaleLowerCase()),
                                                ).slice(0, 5).map(album => (
                                                    <button key={album.id} onClick={() => void handleManualSelect(b.albumId, album.id)}>
                                                        {album.artist} — {album.title}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                                <div className="binding-actions">
                                    {b.libraryExists && b.libraryAlbumId && onNavigateToLibrary && (
                                        <Button
                                            variant="secondary"
                                            onClick={() => onNavigateToLibrary(b.libraryAlbumId!)}
                                            disabled={processingId === b.albumId}
                                        >
                                            {t.bindings.viewInLibrary}
                                        </Button>
                                    )}
                                    {b.state === "proposed" && (
                                        <Button
                                            onClick={() => handleConfirm(b.albumId)}
                                            disabled={processingId === b.albumId}
                                        >
                                            {t.bindings.confirm}
                                        </Button>
                                    )}
                                    {!b.libraryExists && (
                                        <>
                                            <Button
                                                variant="secondary"
                                                onClick={() => void handleReviewCandidates(b.albumId)}
                                                disabled={candidateLoadingId === b.albumId}
                                            >
                                                {candidateLoadingId === b.albumId ? t.common.loading : t.bindings.candidates.review}
                                            </Button>
                                            <Button
                                                onClick={() => handleStartCapture(b)}
                                                disabled={processingId === b.albumId}
                                            >
                                                {t.bindings.capture}
                                            </Button>
                                        </>
                                    )}
                                    <Button
                                        variant="secondary"
                                        onClick={() => handleDelete(b.albumId)}
                                        disabled={processingId === b.albumId}
                                    >
                                        {t.bindings.delete}
                                    </Button>
                                </div>
                            </section>
                        </div>
                        )}
                    </Card>
                ))}
            </div>
        </div>
    )
}
