import { useState, useEffect, useCallback } from "react"

import type { Album } from "../types/album"
import type { RotationPlanRepository } from "../repositories/rotationPlanRepository"
import type { RotationPlan } from "../domain/rotation-plan/rotationPlan"

import { generateRotationPlan } from "../domain/rotation-plan/generateRotationPlan"
import { findReplacementCandidates } from "../domain/rotation-plan/findReplacement"

export function useRotationPlan(
    repository: RotationPlanRepository,
    albums: Album[],
) {
    const [rotationPlan, setRotationPlan] = useState<RotationPlan | null>(() => {
        const draft = repository.loadDraft()
        if (draft && Array.isArray(draft.items)) {
            return draft
        }
        const active = repository.loadActive()
        if (active && Array.isArray(active.items)) {
            return active
        }
        return null
    })

    useEffect(() => {
        if (!rotationPlan) {
            repository.clear()
            return
        }
        if (rotationPlan.status === "active") {
            repository.saveActive(rotationPlan)
            repository.clearDraft()
        } else {
            repository.saveDraft(rotationPlan)
            repository.clearActive()
        }
    }, [rotationPlan, repository])

    const generatePlan = useCallback(() => {
        setRotationPlan(generateRotationPlan(albums))
    }, [albums])

    const removeFromPlan = useCallback((albumId: string) => {
        setRotationPlan(previous => {
            if (!previous) {
                return null
            }
            const updatedItems = previous.items.filter(
                item => item.albumId !== albumId
            )
            return {
                ...previous,
                items: updatedItems,
                albumIds: updatedItems.map(item => item.albumId),
            }
        })
    }, [])

    const replaceAlbum = useCallback((
        removedAlbumId: string,
        replacementAlbumId: string,
    ) => {
        setRotationPlan(previous => {
            if (!previous) {
                return null
            }
            const removedItem = previous.items.find(
                item => item.albumId === removedAlbumId
            )
            if (!removedItem) {
                return previous
            }
            const replacementAlbum = albums.find(
                album => album.id === replacementAlbumId
            )
            if (!replacementAlbum) {
                return previous
            }
            const updatedItems = previous.items.map(item =>
                item.albumId === removedAlbumId
                    ? {
                        ...item,
                        albumId: replacementAlbumId,
                        role: replacementAlbum.category ?? item.role,
                        reason: "fill" as const,
                    }
                    : item
            )
            return {
                ...previous,
                items: updatedItems,
                albumIds: updatedItems.map(item => item.albumId),
            }
        })
    }, [albums])

    const acceptPlan = useCallback(() => {
        setRotationPlan(previous => {
            if (!previous) {
                return null
            }
            return {
                ...previous,
                status: "active" as const,
                acceptedAt: new Date().toISOString(),
            }
        })
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
    }
}
