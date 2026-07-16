import { useState, useEffect, useCallback } from "react"

import type { Album } from "../types/album"
import type { RotationPlan } from "../domain/rotation-plan/rotationPlan"

import { generateRotationPlan } from "../domain/rotation-plan/generateRotationPlan"
import { findReplacementCandidates } from "../domain/rotation-plan/findReplacement"
import { chooseRandomServerFocus, fetchRotationState, saveRotationPlan, setServerFocus } from "../services/api/rotationStateService"

export function useRotationPlan(
    albums: Album[],
    isConnected: boolean,
) {
    const [rotationPlan, setRotationPlan] = useState<RotationPlan | null>(null)
    const [focusAlbumId, setFocusAlbumIdState] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(isConnected)
    const [error, setError] = useState<string | null>(null)

    const refresh = useCallback(async () => {
        if (!isConnected) return false
        setIsLoading(true)
        try {
            const state = await fetchRotationState()
            const current = state.draft ?? state.active
            setRotationPlan(current)
            setFocusAlbumIdState(state.active?.focusAlbumId ?? null)
            setError(null)
            return true
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : "Rotation request failed")
            return false
        } finally {
            setIsLoading(false)
        }
    }, [isConnected])

    useEffect(() => {
        if (isConnected) queueMicrotask(() => void refresh())
    }, [isConnected, refresh])

    const persist = useCallback(async (plan: RotationPlan, nextFocusAlbumId: string | null = focusAlbumId): Promise<boolean> => {
        try {
            const confirmed = await saveRotationPlan(plan, plan.status === "active" ? nextFocusAlbumId : null)
            setRotationPlan(confirmed)
            if (confirmed.status === "active") setFocusAlbumIdState(confirmed.focusAlbumId)
            setError(null)
            return true
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : "Rotation mutation failed")
            return false
        }
    }, [focusAlbumId])

    const generatePlan = useCallback(async () => persist(generateRotationPlan(albums)), [albums, persist])

    const removeFromPlan = useCallback(async (albumId: string) => {
        if (!rotationPlan) return false
        const updatedItems = rotationPlan.items.filter(item => item.albumId !== albumId)
        const nextFocus = focusAlbumId === albumId ? null : focusAlbumId
        return persist({ ...rotationPlan, items: updatedItems, albumIds: updatedItems.map(item => item.albumId) }, nextFocus)
    }, [focusAlbumId, persist, rotationPlan])

    const replaceAlbum = useCallback((
        removedAlbumId: string,
        replacementAlbumId: string,
    ) => {
        if (!rotationPlan) return false
            const removedItem = rotationPlan.items.find(
                item => item.albumId === removedAlbumId
            )
            if (!removedItem) return false
            const replacementAlbum = albums.find(
                album => album.id === replacementAlbumId
            )
            if (!replacementAlbum) return false
            const updatedItems = rotationPlan.items.map(item =>
                item.albumId === removedAlbumId
                    ? {
                        ...item,
                        albumId: replacementAlbumId,
                        role: replacementAlbum.category ?? item.role,
                        reason: "fill" as const,
                    }
                    : item
            )
            return persist({
                ...rotationPlan,
                items: updatedItems,
                albumIds: updatedItems.map(item => item.albumId),
            }, focusAlbumId === removedAlbumId ? replacementAlbumId : focusAlbumId)
    }, [albums, focusAlbumId, persist, rotationPlan])

    const acceptPlan = useCallback(async () => {
        if (!rotationPlan) return false
            return persist({
                ...rotationPlan,
                status: "active" as const,
                acceptedAt: new Date().toISOString(),
            }, focusAlbumId && rotationPlan.albumIds.includes(focusAlbumId) ? focusAlbumId : null)
    }, [focusAlbumId, persist, rotationPlan])

    const setFocusAlbumId = useCallback(async (albumId: string | null) => {
        try {
            const active = await setServerFocus(albumId)
            setFocusAlbumIdState(active.focusAlbumId)
            setError(null)
            return true
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : "Focus mutation failed")
            return false
        }
    }, [])

    const suggestFocusAlbum = useCallback(async () => {
        try {
            const active = await chooseRandomServerFocus()
            setFocusAlbumIdState(active.focusAlbumId)
            setError(null)
            return true
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : "Focus mutation failed")
            return false
        }
    }, [])

    const getReplacementCandidates = useCallback((
        removedAlbumId: string,
    ) => {
        if (!rotationPlan) {
            return []
        }
        const removedItem = rotationPlan.items.find(
            item => item.albumId === removedAlbumId
        )
        if (!removedItem) {
            return []
        }
        return findReplacementCandidates(
            removedItem,
            rotationPlan,
            albums,
        )
    }, [rotationPlan, albums])

    return {
        rotationPlan,
        generatePlan,
        removeFromPlan,
        replaceAlbum,
        acceptPlan,
        getReplacementCandidates,
        focusAlbumId,
        setFocusAlbumId,
        suggestFocusAlbum,
        isLoading,
        error,
        refresh,
    }
}
