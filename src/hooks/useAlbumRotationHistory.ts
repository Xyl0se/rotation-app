import { useEffect, useState } from "react"

import type { RotationPlan } from "../domain/rotation-plan/rotationPlan"
import { fetchRotationHistory } from "../services/api/rotationStateService"

export function useAlbumRotationHistory(albumId: string | null, enabled: boolean) {
    const [plans, setPlans] = useState<RotationPlan[]>([])
    const [isLoading, setIsLoading] = useState(enabled)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!albumId || !enabled) {
            return
        }
        let cancelled = false
        queueMicrotask(() => {
            if (!cancelled) setIsLoading(true)
        })
        void fetchRotationHistory(100, 0)
            .then(result => {
                if (!cancelled) {
                    setPlans(result.items.filter(plan => plan.albumIds.includes(albumId)))
                    setError(null)
                }
            })
            .catch(cause => {
                if (!cancelled) setError(cause instanceof Error ? cause.message : "Rotation history request failed")
            })
            .finally(() => {
                if (!cancelled) setIsLoading(false)
            })
        return () => { cancelled = true }
    }, [albumId, enabled])

    return enabled ? { plans, isLoading, error } : { plans: [], isLoading: false, error: null }
}
