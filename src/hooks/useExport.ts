import { useState, useCallback, useRef } from "react"
import type { RotationPlan } from "../domain/rotation-plan/rotationPlan"
import type { ExportPreviewResult, StagingProgress, ApplyResult } from "../services/api/exportService"
import {
    createExportPreview,
    stageExport,
    getExportStatus,
    applyExport,
    getStartupRecoveryInfo,
} from "../services/api/exportService"

export type ExportStep = "idle" | "previewing" | "preview" | "staging" | "staged" | "applying" | "applied" | "error"

export interface ExportState {
    step: ExportStep
    preview: ExportPreviewResult | null
    progress: StagingProgress | null
    applyResult: ApplyResult | null
    error: string | null
    warning: string | null
}

export function useExport() {
    const [state, setState] = useState<ExportState>({
        step: "idle",
        preview: null,
        progress: null,
        applyResult: null,
        error: null,
        warning: null,
    })

    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const lastPlanRef = useRef<RotationPlan | null>(null)

    const stopPolling = useCallback(() => {
        if (pollRef.current) {
            clearInterval(pollRef.current)
            pollRef.current = null
        }
    }, [])

    const preview = useCallback(async (plan: RotationPlan | null) => {
        if (!plan || plan.items.length === 0) {
            setState({
                step: "error",
                preview: null,
                progress: null,
                applyResult: null,
                error: "No active rotation plan found",
                warning: null,
            })
            return
        }

        lastPlanRef.current = plan
        setState(s => ({ ...s, step: "previewing", error: null, warning: null }))

        try {
            const albumIds = plan.items.map(item => item.albumId)
            const result = await createExportPreview(albumIds)
            setState({
                step: "preview",
                preview: result,
                progress: null,
                applyResult: null,
                error: null,
                warning: null,
            })
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err)
            setState({
                step: "error",
                preview: null,
                progress: null,
                applyResult: null,
                error: message,
                warning: null,
            })
        }
    }, [])

    const runStage = useCallback(async () => {
        setState(s => ({ ...s, step: "staging", error: null, warning: null }))

        try {
            const previewResult = state.preview
            if (!previewResult) {
                throw new Error("No preview available")
            }

            const albumIds = previewResult.sources.map(s => s.albumId)
            await stageExport(previewResult.exportId, albumIds)

            // Start polling with timeout
            stopPolling()
            let elapsed = 0
            const POLL_INTERVAL_MS = 500
            const POLL_TIMEOUT_MS = 60000

            pollRef.current = setInterval(async () => {
                elapsed += POLL_INTERVAL_MS
                if (elapsed >= POLL_TIMEOUT_MS) {
                    stopPolling()
                    setState(s => ({
                        ...s,
                        step: "error",
                        error: "Export staging timed out. Please try again.",
                        warning: null,
                    }))
                    return
                }

                try {
                    const progress = await getExportStatus(previewResult.exportId)
                    const hasSkipped = progress.skippedSources && progress.skippedSources.length > 0
                    const warning = hasSkipped
                        ? `${progress.skippedSources!.length} album(s) could not be copied`
                        : null

                    if (progress.status === "staged") {
                        stopPolling()
                        setState(s => ({
                            ...s,
                            step: "staged",
                            progress,
                            error: null,
                            warning,
                        }))
                    } else if (progress.status === "failed") {
                        stopPolling()
                        setState(s => ({
                            ...s,
                            step: "error",
                            progress,
                            error: progress.error ?? "Staging failed",
                            warning: null,
                        }))
                    } else {
                        setState(s => ({ ...s, progress, warning }))
                    }
                } catch (err) {
                    stopPolling()
                    const message = err instanceof Error ? err.message : String(err)
                    setState(s => ({
                        ...s,
                        step: "error",
                        error: message,
                        warning: null,
                    }))
                }
            }, POLL_INTERVAL_MS)
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err)
            setState(s => ({
                ...s,
                step: "error",
                error: message,
                warning: null,
            }))
        }
    }, [state.preview, stopPolling])

    const runApply = useCallback(async () => {
        setState(s => ({ ...s, step: "applying", error: null }))

        try {
            const previewResult = state.preview
            if (!previewResult) {
                throw new Error("No preview available")
            }

            const result = await applyExport(previewResult.exportId)
            setState(s => ({
                ...s,
                step: "applied",
                applyResult: result,
                error: null,
            }))
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err)
            setState(s => ({
                ...s,
                step: "error",
                error: message,
            }))
        }
    }, [state.preview])

    const reset = useCallback(() => {
        stopPolling()
        setState({
            step: "idle",
            preview: null,
            progress: null,
            applyResult: null,
            error: null,
            warning: null,
        })
    }, [stopPolling])

    const retryFromStep = useCallback(async () => {
        setState(s => ({ ...s, step: "staging", error: null, warning: null }))
        await runStage()
    }, [runStage])

    const resetAndStartOver = useCallback(async () => {
        reset()
        if (lastPlanRef.current) {
            await preview(lastPlanRef.current)
        }
    }, [reset, preview])

    const retry = useCallback(async () => {
        reset()
        if (lastPlanRef.current) {
            await preview(lastPlanRef.current)
        }
    }, [reset, preview])

    const checkStartupRecovery = useCallback(async () => {
        try {
            const info = await getStartupRecoveryInfo()
            if (info.recovered > 0 || info.cleanedStagingDirs > 0 || info.cleanedArchives > 0) {
                return info
            }
            return null
        } catch {
            return null
        }
    }, [])

    return {
        state,
        preview,
        runStage,
        runApply,
        retry,
        reset,
        retryFromStep,
        resetAndStartOver,
        checkStartupRecovery,
    }
}
