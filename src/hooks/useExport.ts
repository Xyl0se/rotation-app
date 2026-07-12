import { useState, useCallback, useRef } from "react"
import type { RotationPlan } from "../domain/rotation-plan/rotationPlan"
import type { ExportPreviewResult, StagingProgress, ApplyResult } from "../services/api/exportService"
import {
    createExportPreview,
    stageExport,
    getExportStatus,
    applyExport,
} from "../services/api/exportService"

export type ExportStep = "idle" | "previewing" | "preview" | "staging" | "staged" | "applying" | "applied" | "error"

export interface ExportState {
    step: ExportStep
    preview: ExportPreviewResult | null
    progress: StagingProgress | null
    applyResult: ApplyResult | null
    error: string | null
}

export function useExport() {
    const [state, setState] = useState<ExportState>({
        step: "idle",
        preview: null,
        progress: null,
        applyResult: null,
        error: null,
    })

    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

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
            })
            return
        }

        setState(s => ({ ...s, step: "previewing", error: null }))

        try {
            const albumIds = plan.items.map(item => item.albumId)
            const result = await createExportPreview(albumIds)
            setState({
                step: "preview",
                preview: result,
                progress: null,
                applyResult: null,
                error: null,
            })
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err)
            setState({
                step: "error",
                preview: null,
                progress: null,
                applyResult: null,
                error: message,
            })
        }
    }, [])

    const runStage = useCallback(async () => {
        setState(s => ({ ...s, step: "staging", error: null }))

        try {
            const previewResult = state.preview
            if (!previewResult) {
                throw new Error("No preview available")
            }

            const albumIds = previewResult.sources.map(s => s.albumId)
            await stageExport(previewResult.exportId, albumIds)

            // Start polling
            stopPolling()
            pollRef.current = setInterval(async () => {
                try {
                    const progress = await getExportStatus(previewResult.exportId)
                    if (progress.status === "staged") {
                        stopPolling()
                        setState(s => ({
                            ...s,
                            step: "staged",
                            progress,
                            error: null,
                        }))
                    } else if (progress.status === "failed") {
                        stopPolling()
                        setState(s => ({
                            ...s,
                            step: "error",
                            progress,
                            error: progress.error ?? "Staging failed",
                        }))
                    } else {
                        setState(s => ({ ...s, progress }))
                    }
                } catch (err) {
                    stopPolling()
                    const message = err instanceof Error ? err.message : String(err)
                    setState(s => ({
                        ...s,
                        step: "error",
                        error: message,
                    }))
                }
            }, 500)
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err)
            setState(s => ({
                ...s,
                step: "error",
                error: message,
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
        })
    }, [stopPolling])

    return {
        state,
        preview,
        runStage,
        runApply,
        reset,
    }
}
