import { useState, useEffect, useCallback } from "react"
import {
    fetchDiagnostics,
    runArtworkFeasibility,
    type ArtworkFeasibilityReport,
    type DiagnosticsResponse,
} from "../../../services/api/diagnosticsService.js"
import { triggerScan, getScanProgress } from "../../../services/api/scanService.js"
import { getApiErrorMessage, ApiError } from "../../../services/api/apiClient.js"
import { useI18n } from "../../../i18n/useI18n.js"

type PanelState = "loading" | "error" | "info" | "warning" | "ok"

function derivePanelState(diag: DiagnosticsResponse | null, error: string | null): PanelState {
    if (error) return "error"
    if (!diag) return "loading"
    const infraOk =
        diag.connectivity.database &&
        diag.filesystem.musicPath.exists &&
        diag.filesystem.musicPath.readable &&
        diag.filesystem.workspacePath.exists &&
        diag.filesystem.workspacePath.writable &&
        diag.filesystem.syncthingRoot.exists &&
        diag.filesystem.syncthingRoot.writable
    if (!infraOk) return "warning"
    if (!diag.bindings.lastScanAt) return "info"
    if (diag.bindings.total === 0) return "warning"
    return "ok"
}

function deriveSummaryText(state: PanelState, t: ReturnType<typeof useI18n>["t"]): string {
    switch (state) {
        case "error": return t.diagnostics.error
        case "loading": return t.diagnostics.loading
        case "warning": return t.diagnostics.issuesDetected
        case "info": return t.diagnostics.infoStatus
        case "ok": return t.diagnostics.allOk
    }
}

function deriveIcon(state: PanelState): string {
    switch (state) {
        case "error": return "🔴"
        case "loading": return "⏳"
        case "warning": return "🟡"
        case "info": return "🔵"
        case "ok": return "🟢"
    }
}

export default function DiagnosticsPanel() {
    const { t } = useI18n()
    const [diag, setDiag] = useState<DiagnosticsResponse | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [expanded, setExpanded] = useState(false)
    const [scanning, setScanning] = useState(false)
    const [scanQueued, setScanQueued] = useState(false)
    const [scanProgress, setScanProgress] = useState<{ directoriesScanned: number; directoriesSkipped: number } | null>(null)
    const [coverBatch, setCoverBatch] = useState<{
        attempted: number; local: number; cached: number; missing: number; failed: number
    } | null>(null)
    const [artworkProbeRunning, setArtworkProbeRunning] = useState(false)
    const [artworkReport, setArtworkReport] = useState<ArtworkFeasibilityReport | null>(null)
    const [artworkProbeError, setArtworkProbeError] = useState<string | null>(null)

    const load = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const d = await fetchDiagnostics()
            setDiag(d)
        } catch (e) {
            setError(getApiErrorMessage(e))
        } finally {
            setLoading(false)
        }
    }, [])

    const handleArtworkProbe = useCallback(async () => {
        setArtworkProbeRunning(true)
        setArtworkProbeError(null)
        try {
            setArtworkReport(await runArtworkFeasibility())
        } catch (e) {
            setArtworkProbeError(getApiErrorMessage(e))
        } finally {
            setArtworkProbeRunning(false)
        }
    }, [])

    useEffect(() => {
        void Promise.resolve().then(load)
    }, [load])

    const handleScan = useCallback(async () => {
        setScanning(true)
        setScanQueued(false)
        setScanProgress(null)
        setCoverBatch(null)
        let progressPoll: ReturnType<typeof setInterval> | null = null

        try {
            const response = await triggerScan()
            setCoverBatch(response.coverResolution ?? null)
            setScanQueued(true)

            // Poll for scan progress every 2 seconds
            progressPoll = setInterval(async () => {
                try {
                    const progress = await getScanProgress(response.scanId)
                    setScanProgress({
                        directoriesScanned: progress.directoriesScanned,
                        directoriesSkipped: progress.directoriesSkipped,
                    })
                    if (progress.status !== "running") {
                        if (progressPoll) clearInterval(progressPoll)
                        // Final refresh via diagnostics
                        const d = await fetchDiagnostics()
                        setDiag(d)
                        setScanning(false)
                        setScanProgress(null)
                    }
                } catch (e) {
                    // 404 = older server without progress endpoint, fallback to generic scanning
                    if (e instanceof ApiError && e.status === 404) {
                        setScanProgress(null)
                    } else {
                        if (progressPoll) clearInterval(progressPoll)
                        setScanning(false)
                        setScanProgress(null)
                    }
                }
            }, 2000)

            // Also poll diagnostics for completion (in case progress endpoint fails)
            const diagPoll = setInterval(async () => {
                try {
                    const d = await fetchDiagnostics()
                    setDiag(d)
                    if (d.bindings.lastScanStatus && d.bindings.lastScanStatus !== "running") {
                        clearInterval(diagPoll)
                        if (progressPoll) clearInterval(progressPoll)
                        setScanning(false)
                        setScanProgress(null)
                    }
                } catch {
                    clearInterval(diagPoll)
                    if (progressPoll) clearInterval(progressPoll)
                    setScanning(false)
                    setScanProgress(null)
                }
            }, 2000)

            // Safety timeout after 60 seconds
            setTimeout(() => {
                if (progressPoll) clearInterval(progressPoll)
                clearInterval(diagPoll)
                setScanning(false)
                setScanProgress(null)
            }, 60000)
        } catch (e) {
            setError(getApiErrorMessage(e))
            setScanning(false)
        }
    }, [])

    const state = derivePanelState(diag, error)
    const summary = deriveSummaryText(state, t)
    const icon = deriveIcon(state)

    if (state === "error") {
        return (
            <div className="diagnostics diagnostics--error">
                <span className="diagnostics-icon">{icon}</span>
                <span className="diagnostics-summary">{summary}: {error}</span>
                <button className="diagnostics-refresh" onClick={load} disabled={loading}>
                    🔄
                </button>
            </div>
        )
    }

    if (state === "loading") {
        return (
            <div className="diagnostics diagnostics--loading">
                <span className="diagnostics-icon">{icon}</span>
                <span className="diagnostics-summary">{summary}</span>
            </div>
        )
    }

    const showScanButton = !diag?.bindings.lastScanAt ||
        diag?.bindings.lastScanStatus === "failed" ||
        diag?.bindings.total === 0

    return (
        <div className={`diagnostics diagnostics--${state}`}>
            <button
                className="diagnostics-header"
                onClick={() => setExpanded(!expanded)}
                aria-expanded={expanded}
            >
                <span className="diagnostics-icon">{icon}</span>
                <span className="diagnostics-summary">{summary}</span>
                <span className="diagnostics-chevron">{expanded ? "▲" : "▼"}</span>
                <button
                    className="diagnostics-refresh"
                    onClick={(e) => { e.stopPropagation(); load() }}
                    disabled={loading}
                    title={t.diagnostics.refresh}
                >
                    🔄
                </button>
            </button>

            {expanded && (
                <div className="diagnostics-details">
                    <CheckRow
                        label={t.diagnostics.database}
                        ok={diag!.connectivity.database}
                        okText={t.diagnostics.ok}
                        failText={t.diagnostics.databaseFail}
                    />
                    <CheckRow
                        label={t.diagnostics.musicFolder}
                        ok={diag!.filesystem.musicPath.exists && diag!.filesystem.musicPath.readable}
                        okText={`${t.diagnostics.ok} (${diag!.filesystem.musicPath.albumFoldersFound} ${t.diagnostics.albumFolders})`}
                        failText={
                            !diag!.filesystem.musicPath.exists
                                ? t.diagnostics.musicFolderMissing
                                : t.diagnostics.musicFolderNotReadable
                        }
                    />
                    <CheckRow
                        label={t.diagnostics.workspaceFolder}
                        ok={diag!.filesystem.workspacePath.exists && diag!.filesystem.workspacePath.writable}
                        okText={t.diagnostics.ok}
                        failText={
                            !diag!.filesystem.workspacePath.exists
                                ? t.diagnostics.workspaceFolderMissing
                                : t.diagnostics.workspaceFolderNotWritable
                        }
                    />
                    <CheckRow
                        label={t.diagnostics.syncthingFolder}
                        ok={diag!.filesystem.syncthingRoot.exists && diag!.filesystem.syncthingRoot.writable}
                        okText={t.diagnostics.ok}
                        failText={
                            !diag!.filesystem.syncthingRoot.exists
                                ? t.diagnostics.syncthingFolderMissing
                                : t.diagnostics.syncthingFolderNotWritable
                        }
                    />
                    <CheckRow
                        label={t.diagnostics.bindings}
                        ok={diag!.bindings.total > 0}
                        okText={`${diag!.bindings.total} (${diag!.bindings.confirmed} ${t.diagnostics.confirmed}, ${diag!.bindings.proposed} ${t.diagnostics.proposed})`}
                        failText={
                            diag!.bindings.lastScanAt
                                ? t.diagnostics.bindingsEmptyAfterScan
                                : t.diagnostics.bindingsNoScan
                        }
                    />
                    {diag!.bindings.lastScanAt && (
                        <div className="diagnostics-meta">
                            {t.diagnostics.lastScan}: {new Date(diag!.bindings.lastScanAt).toLocaleString()} — {diag!.bindings.lastScanStatus}
                        </div>
                    )}

                    {showScanButton && (
                        <div className="diagnostics-scan-action">
                            <button
                                className="diagnostics-scan-button"
                                onClick={handleScan}
                                disabled={scanning}
                            >
                                {scanning
                                    ? scanProgress
                                        ? t.diagnostics.scanningWithProgress(scanProgress.directoriesScanned, scanProgress.directoriesSkipped)
                                        : t.diagnostics.scanning
                                    : t.diagnostics.scanNow}
                            </button>
                            {scanQueued && !scanning && (
                                <span className="diagnostics-scan-queued">{t.diagnostics.scanQueued}</span>
                            )}
                        </div>
                    )}
                    {coverBatch && (
                        <div className="diagnostics-meta">
                            {t.diagnostics.coverBatchSummary(
                                coverBatch.attempted,
                                coverBatch.local,
                                coverBatch.cached,
                                coverBatch.missing,
                                coverBatch.failed,
                            )}
                        </div>
                    )}
                    <div className="diagnostics-artwork-probe">
                        <div>
                            <strong>{t.diagnostics.artworkProbeTitle}</strong>
                            <p>{t.diagnostics.artworkProbeDescription}</p>
                        </div>
                        <button
                            className="diagnostics-scan-button"
                            onClick={handleArtworkProbe}
                            disabled={artworkProbeRunning || diag!.bindings.confirmed === 0}
                        >
                            {artworkProbeRunning
                                ? t.diagnostics.artworkProbeRunning
                                : t.diagnostics.artworkProbeRun}
                        </button>
                        {artworkProbeError && (
                            <p className="diagnostics-artwork-error">{artworkProbeError}</p>
                        )}
                        {artworkReport && (
                            <div className="diagnostics-artwork-results">
                                <p>{t.diagnostics.artworkProbeInspected(artworkReport.bindingsInspected)}</p>
                                {artworkReport.samples.map(sample => (
                                    <div className="diagnostics-artwork-result" key={sample.format}>
                                        <strong>{sample.format.toUpperCase()}</strong>
                                        <span>{t.diagnostics.artworkProbeOutcome[sample.outcome]}</span>
                                        <span>{t.diagnostics.artworkProbeTime(sample.elapsedMs)}</span>
                                        <span>{t.diagnostics.artworkProbeMemory(formatBytes(sample.rssDeltaBytes))}</span>
                                        <span>{t.diagnostics.artworkProbeCover(
                                            sample.coverBytes === null ? "—" : formatBytes(sample.coverBytes),
                                        )}</span>
                                    </div>
                                ))}
                                {artworkReport.missingFormats.length > 0 && (
                                    <p>{t.diagnostics.artworkProbeMissing(artworkReport.missingFormats.join(", ").toUpperCase())}</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KiB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MiB`
}

function CheckRow({
    label,
    ok,
    okText,
    failText,
}: {
    label: string
    ok: boolean
    okText: string
    failText: string
}) {
    return (
        <div className="diagnostics-row">
            <span className="diagnostics-row-icon">{ok ? "✅" : "❌"}</span>
            <span className="diagnostics-row-label">{label}</span>
            <span className={`diagnostics-row-status diagnostics-row-status--${ok ? "ok" : "fail"}`}>
                {ok ? okText : failText}
            </span>
        </div>
    )
}
