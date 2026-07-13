import { useState, useEffect, useCallback } from "react"
import { fetchDiagnostics, type DiagnosticsResponse } from "../../../services/api/diagnosticsService.js"
import { getApiErrorMessage } from "../../../services/api/apiClient.js"
import { useI18n } from "../../../i18n/useI18n.js"

export default function DiagnosticsPanel() {
    const { t } = useI18n()
    const [diag, setDiag] = useState<DiagnosticsResponse | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [expanded, setExpanded] = useState(false)

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

    useEffect(() => {
        load()
    }, [load])

    const hasIssue =
        !diag?.connectivity.database ||
        !diag?.filesystem.musicPath.exists ||
        !diag?.filesystem.musicPath.readable ||
        !diag?.filesystem.workspacePath.exists ||
        !diag?.filesystem.workspacePath.writable ||
        !diag?.filesystem.syncthingRoot.exists ||
        !diag?.filesystem.syncthingRoot.writable ||
        diag.bindings.total === 0

    if (error) {
        return (
            <div className="diagnostics diagnostics--error">
                <span className="diagnostics-icon">🔴</span>
                <span className="diagnostics-summary">{t.diagnostics.error}: {error}</span>
                <button className="diagnostics-refresh" onClick={load} disabled={loading}>
                    🔄
                </button>
            </div>
        )
    }

    if (!diag) {
        return (
            <div className="diagnostics diagnostics--loading">
                <span className="diagnostics-icon">⏳</span>
                <span className="diagnostics-summary">{t.diagnostics.loading}</span>
            </div>
        )
    }

    return (
        <div className={`diagnostics diagnostics--${hasIssue ? "warning" : "ok"}`}>
            <button
                className="diagnostics-header"
                onClick={() => setExpanded(!expanded)}
                aria-expanded={expanded}
            >
                <span className="diagnostics-icon">{hasIssue ? "🟡" : "🟢"}</span>
                <span className="diagnostics-summary">
                    {hasIssue ? t.diagnostics.issuesDetected : t.diagnostics.allOk}
                </span>
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
                        ok={diag.connectivity.database}
                        okText={t.diagnostics.ok}
                        failText={t.diagnostics.databaseFail}
                    />
                    <CheckRow
                        label={t.diagnostics.musicFolder}
                        ok={diag.filesystem.musicPath.exists && diag.filesystem.musicPath.readable}
                        okText={`${t.diagnostics.ok} (${diag.filesystem.musicPath.albumFoldersFound} ${t.diagnostics.albumFolders})`}
                        failText={
                            !diag.filesystem.musicPath.exists
                                ? t.diagnostics.musicFolderMissing
                                : t.diagnostics.musicFolderNotReadable
                        }
                    />
                    <CheckRow
                        label={t.diagnostics.workspaceFolder}
                        ok={diag.filesystem.workspacePath.exists && diag.filesystem.workspacePath.writable}
                        okText={t.diagnostics.ok}
                        failText={
                            !diag.filesystem.workspacePath.exists
                                ? t.diagnostics.workspaceFolderMissing
                                : t.diagnostics.workspaceFolderNotWritable
                        }
                    />
                    <CheckRow
                        label={t.diagnostics.syncthingFolder}
                        ok={diag.filesystem.syncthingRoot.exists && diag.filesystem.syncthingRoot.writable}
                        okText={t.diagnostics.ok}
                        failText={
                            !diag.filesystem.syncthingRoot.exists
                                ? t.diagnostics.syncthingFolderMissing
                                : t.diagnostics.syncthingFolderNotWritable
                        }
                    />
                    <CheckRow
                        label={t.diagnostics.bindings}
                        ok={diag.bindings.total > 0}
                        okText={`${diag.bindings.total} (${diag.bindings.confirmed} ${t.diagnostics.confirmed}, ${diag.bindings.proposed} ${t.diagnostics.proposed})`}
                        failText={
                            diag.bindings.lastScanAt
                                ? t.diagnostics.bindingsEmptyAfterScan
                                : t.diagnostics.bindingsNoScan
                        }
                    />
                    {diag.bindings.lastScanAt && (
                        <div className="diagnostics-meta">
                            {t.diagnostics.lastScan}: {new Date(diag.bindings.lastScanAt).toLocaleString()} — {diag.bindings.lastScanStatus}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
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
