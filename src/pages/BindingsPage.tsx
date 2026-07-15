import { useState, useEffect, useCallback } from "react"
import {
    fetchBindings,
    confirmBinding,
    deleteBinding,
    verifyBindings,
    reconcileBindings,
    linkBinding,
    type Binding,
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
import type { Album } from "../types/album.js"
import { generateUUID } from "../utils/uuid.js"
import { createAlbum } from "../services/api/albumsService.js"
import { getScanProgress, triggerScan } from "../services/api/scanService.js"

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
}

export default function BindingsPage({ onNavigateToLibrary }: BindingsPageProps) {
    const { t } = useI18n()
    const toast = useToast()
    const [bindings, setBindings] = useState<Binding[]>([])
    const [filter, setFilter] = useState<"all" | "proposed" | "confirmed" | "missing">("all")
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

    const load = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const state = filter === "all" ? undefined : filter
            const response = await fetchBindings(state)
            setBindings(response.bindings)
        } catch (e) {
            setError(getApiErrorMessage(e))
        } finally {
            setLoading(false)
        }
    }, [filter])

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
        setCaptureBindingId(binding.albumId)
        setCaptureAlbum(makeEmptyAlbum())
        setShowCaptureDialog(true)
    }

    async function handleCaptureFinish(album: Album) {
        if (!captureBindingId) return
        try {
            const created = await createAlbum(album)
            await linkBinding(captureBindingId, created.id)
            toast.success(t.bindings.captureSuccess)
            setShowCaptureDialog(false)
            setCaptureAlbum(makeEmptyAlbum())
            setCaptureBindingId(null)
            await load()
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
                {(["all", "proposed", "confirmed", "missing"] as const).map((f) => (
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

            <div className="bindings-list">
                {bindings.map((b) => (
                    <Card key={b.albumId}>
                        <div className="binding-row">
                            <div className="binding-info">
                                {b.albumTitle && b.albumArtist ? (
                                    <span className="binding-preview">
                                        {t.bindings.albumPreview(b.albumTitle, b.albumArtist)}
                                    </span>
                                ) : (
                                    <span className="binding-path">{b.relativePath}</span>
                                )}
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
                                    <Button
                                        onClick={() => handleStartCapture(b)}
                                        disabled={processingId === b.albumId}
                                    >
                                        {t.bindings.capture}
                                    </Button>
                                )}
                                <Button
                                    variant="secondary"
                                    onClick={() => handleDelete(b.albumId)}
                                    disabled={processingId === b.albumId}
                                >
                                    {t.bindings.delete}
                                </Button>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    )
}
