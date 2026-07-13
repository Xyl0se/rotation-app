import { useState, useEffect, useCallback } from "react"
import {
    fetchBindings,
    confirmBinding,
    deleteBinding,
    verifyBindings,
    reconcileBindings,
    type Binding,
    type VerifyResult,
    type ReconcileResult,
} from "../services/api/bindingsService.js"
import { getApiErrorMessage } from "../services/api/apiClient.js"
import { useI18n } from "../i18n/useI18n.js"
import Button from "../components/ui/Button.js"
import Card from "../components/ui/Card.js"
import DiagnosticsPanel from "../components/features/diagnostics/DiagnosticsPanel.js"

export default function BindingsPage() {
    const { t } = useI18n()
    const [bindings, setBindings] = useState<Binding[]>([])
    const [filter, setFilter] = useState<"all" | "proposed" | "confirmed" | "missing">("all")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [processingId, setProcessingId] = useState<string | null>(null)
    const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null)
    const [reconcileResult, setReconcileResult] = useState<ReconcileResult | null>(null)

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
    }, [filter, t])

    useEffect(() => {
        load()
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
        } catch (e) {
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

    return (
        <div className="bindings-page">
            <DiagnosticsPanel />

            <h1 className="bindings-title">{t.bindings.title}</h1>

            <div className="bindings-actions">
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

            <div className="bindings-list">
                {bindings.map((b) => (
                    <Card key={b.albumId}>
                        <div className="binding-row">
                            <div className="binding-info">
                                <span className="binding-path">{b.relativePath}</span>
                                <span className={`binding-state binding-state--${b.state}`}>
                                    {t.bindings.state[b.state]}
                                </span>
                                {!b.folderExists && (
                                    <span className="binding-missing">{t.bindings.folderMissing}</span>
                                )}
                            </div>
                            <div className="binding-actions">
                                {b.state === "proposed" && (
                                    <Button
                                        onClick={() => handleConfirm(b.albumId)}
                                        disabled={processingId === b.albumId}
                                    >
                                        {t.bindings.confirm}
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
