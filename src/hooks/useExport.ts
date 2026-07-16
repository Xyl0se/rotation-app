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
            const result = await createExportPreview(albumIds, plan.id)
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

    const startStatusPolling = useCallback((exportId: string) => {
        stopPolling()
        const startedAt = Date.now()
        const POLL_INTERVAL_MS = 1500
        const POLL_TIMEOUT_MS = 15 * 60 * 1000

        const poll = async () => {
            if (Date.now() - startedAt >= POLL_TIMEOUT_MS) {
                stopPolling()
                setState(s => ({
                    ...s,
                    step: "error",
                    error: "Export staging timed out after 15 minutes. The server status may still be checked by retrying this step.",
                    warning: null,
                }))
                return
            }

            try {
                const progress = await getExportStatus(exportId)
                const hasSkipped = Boolean(progress.skippedSources?.length)
                const warning = hasSkipped
                    ? `${progress.skippedSources!.length} album(s) could not be copied`
                    : null

                if (progress.status === "staged") {
                    stopPolling()
                    setState(s => ({ ...s, step: "staged", progress, error: null, warning }))
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
                    setState(s => ({ ...s, step: "staging", progress, error: null, warning }))
                }
            } catch (err) {
                // A transient status request must not discard a server-side job.
                // Keep polling until the generous NAS staging deadline is reached.
                setState(s => ({
                    ...s,
                    step: "staging",
                    error: null,
                    warning: err instanceof Error ? err.message : String(err),
                }))
            }

            if (pollRef.current !== null) {
                pollRef.current = setTimeout(() => void poll(), POLL_INTERVAL_MS)
            }
        }

        pollRef.current = setTimeout(() => void poll(), 0)
    }, [stopPolling])

    const runStage = useCallback(async () => {
        setState(s => ({ ...s, step: "staging", error: null, warning: null }))

        try {
            const previewResult = state.preview
            if (!previewResult) {
                throw new Error("No preview available")
            }

            const albumIds = previewResult.sources.map(s => s.albumId)
            const planId = lastPlanRef.current?.id
            if (!planId) throw new Error("No active rotation plan found")
            await stageExport(previewResult.exportId, albumIds, planId).catch(() => undefined)
            // The server may have accepted the job even if the response was
            // interrupted by a proxy or browser timeout. Status is authoritative.
            startStatusPolling(previewResult.exportId)
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err)
            setState(s => ({
                ...s,
                step: "error",
                error: message,
                warning: null,
            }))
        }
    }, [state.preview, startStatusPolling])

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
        const exportId = state.preview?.exportId
        if (exportId) {
            try {
                const progress = await getExportStatus(exportId)
                if (progress.status === "staged") {
                    setState(s => ({ ...s, step: "staged", progress, error: null, warning: null }))
                    return
                }
                startStatusPolling(exportId)
                return
            } catch {
                // No recoverable server job exists; start the current preview once.
            }
        }
        await runStage()
    }, [runStage, startStatusPolling, state.preview])

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
