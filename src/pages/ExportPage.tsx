import { useState, useEffect } from "react"
import type { RotationPlan } from "../domain/rotation-plan/rotationPlan"
import { useExport } from "../hooks/useExport"
import Button from "../components/ui/Button"
import Card from "../components/ui/Card"
import { formatFileSize } from "../utils/formatFileSize"
import { createRotationPlanRepository } from "../repositories/rotationPlanRepository"
import { createLocalStorageAdapter } from "../adapters/localStorageAdapter"
import { useI18n } from "../i18n/useI18n"

function useActiveRotationPlan(): RotationPlan | null {
    const [plan, setPlan] = useState<RotationPlan | null>(null)

    useEffect(() => {
        const adapter = createLocalStorageAdapter()
        const repo = createRotationPlanRepository(adapter)
        const active = repo.loadActive()
        if (active && Array.isArray(active.items)) {
            setPlan(active)
        }
    }, [])

    return plan
}

export default function ExportPage() {
    const { t } = useI18n()
    const rotationPlan = useActiveRotationPlan()
    const { state, preview, runStage, runApply, reset } = useExport()

    return (
        <div className="page export-page">
            <h2>{t.exportPage.title}</h2>

            {state.step === "idle" && (
                <Card>
                    <p className="export-description">
                        {t.exportPage.description}
                    </p>
                    <div className="export-actions">
                        <Button
                            onClick={() => preview(rotationPlan)}
                            disabled={!rotationPlan || rotationPlan.items.length === 0}
                        >
                            {t.exportPage.preview}
                        </Button>
                    </div>
                    {(!rotationPlan || rotationPlan.items.length === 0) && (
                        <p className="export-hint">
                            {t.exportPage.noRotationPlan}
                        </p>
                    )}
                </Card>
            )}

            {state.step === "previewing" && (
                <Card>
                    <p>{t.exportPage.calculating}</p>
                </Card>
            )}

            {(state.step === "preview" || state.step === "staging" || state.step === "staged" || state.step === "applying" || state.step === "applied" || state.step === "error") && state.preview && (
                <Card>
                    <div className="export-summary">
                        <div className="export-stat">
                            <span className="export-stat-value">{state.preview.albumCount}</span>
                            <span className="export-stat-label">{t.exportPage.albums}</span>
                        </div>
                        <div className="export-stat">
                            <span className="export-stat-value">{formatFileSize(state.preview.totalSizeBytes)}</span>
                            <span className="export-stat-label">{t.exportPage.totalSize}</span>
                        </div>
                        <div className="export-stat">
                            <span className="export-stat-value">{state.preview.fileCount}</span>
                            <span className="export-stat-label">{t.exportPage.files}</span>
                        </div>
                    </div>

                    {state.preview.missingBindings.length > 0 && (
                        <div className="export-warning">
                            <strong>{t.exportPage.missingBindings}</strong>
                            <ul>
                                {state.preview.missingBindings.map(id => (
                                    <li key={id}>{id}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {state.preview.unconfirmedBindings.length > 0 && (
                        <div className="export-warning">
                            <strong>{t.exportPage.unconfirmedBindings}</strong>
                            <ul>
                                {state.preview.unconfirmedBindings.map(id => (
                                    <li key={id}>{id}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div className="export-album-list">
                        {state.preview.sources.map(source => (
                            <div key={source.albumId} className="export-album-item">
                                <span className="export-album-artist">{source.artistName}</span>
                                <span className="export-album-name">{source.albumName}</span>
                                <span className="export-album-path">{source.relativePath}</span>
                            </div>
                        ))}
                    </div>

                    {state.step === "preview" && (
                        <div className="export-actions">
                            <Button
                                variant="secondary"
                                onClick={reset}
                            >
                                {t.exportPage.cancel}
                            </Button>
                            <Button
                                onClick={runStage}
                                disabled={!state.preview.canExport}
                            >
                                {t.exportPage.stage}
                            </Button>
                        </div>
                    )}

                    {(state.step === "staging" || state.step === "staged") && (
                        <div className="export-progress">
                            {state.step === "staging" && (
                                <>
                                    <div className="progress-bar">
                                        <div
                                            className="progress-fill"
                                            style={{
                                                width: state.progress?.totalFiles
                                                    ? `${Math.round((state.progress.filesCopied ?? 0) / state.progress.totalFiles * 100)}%`
                                                    : "0%",
                                            }}
                                        />
                                    </div>
                                    <p>
                                        {state.progress?.totalFiles
                                            ? t.exportPage.copyProgress(state.progress.filesCopied ?? 0, state.progress.totalFiles)
                                            : t.exportPage.copying}
                                    </p>
                                </>
                            )}
                            {state.step === "staged" && (
                                <div className="export-actions">
                                    <Button
                                        variant="secondary"
                                        onClick={reset}
                                    >
                                        {t.exportPage.cancel}
                                    </Button>
                                    <Button onClick={runApply}>
                                        {t.exportPage.apply}
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}

                    {state.step === "applying" && (
                        <p>{t.exportPage.applying}</p>
                    )}

                    {state.step === "applied" && state.applyResult && (
                        <div className="export-success">
                            <p>{t.exportPage.success}</p>
                            <p className="export-path">{state.applyResult.exportPath}</p>
                            {state.applyResult.archivePath && (
                                <p className="export-archive">
                                    {t.exportPage.previousExportArchived(state.applyResult.archivePath)}
                                </p>
                            )}
                            <Button onClick={reset}>{t.exportPage.done}</Button>
                        </div>
                    )}

                    {state.step === "error" && (
                        <div className="export-error">
                            <p>{t.exportPage.error(state.error ?? "")}</p>
                            <Button variant="secondary" onClick={reset}>
                                {t.exportPage.reset}
                            </Button>
                        </div>
                    )}
                </Card>
            )}
        </div>
    )
}
