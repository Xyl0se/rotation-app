import type { BindingRepository } from "../infrastructure/persistence/sqlite/bindingRepository.js"
import type { CoverResolver, CoverResolverResult } from "./coverResolver.js"

const MAX_ALBUMS_PER_BATCH = 25
const MAX_PENDING_RESOLUTIONS = 25

export interface CoverResolutionBatchReport {
    attempted: number
    local: number
    cached: number
    missing: number
    failed: number
}

export function createCoverResolutionBatchService(bindingRepo: BindingRepository, coverResolver: CoverResolver) {
    let lastReport: CoverResolutionBatchReport | null = null
    const pending: Array<{ albumId: string; remoteUrls: string[]; forceRefresh: boolean }> = []
    let draining = false

    async function resolveOne(albumId: string, remoteUrls: string[] = [], forceRefresh = false): Promise<CoverResolverResult> {
        return coverResolver.resolve(albumId, remoteUrls, forceRefresh)
    }

    async function drain(): Promise<void> {
        if (draining) return
        draining = true
        try {
            while (pending.length > 0) {
                const task = pending.shift()!
                await resolveOne(task.albumId, task.remoteUrls, task.forceRefresh).catch(() => undefined)
            }
        } finally {
            draining = false
        }
    }

    return {
        resolveOne,

        enqueueOne(albumId: string, remoteUrls: string[] = [], forceRefresh = false): boolean {
            const existing = pending.find(task => task.albumId === albumId)
            if (existing) {
                existing.remoteUrls = [...new Set([...existing.remoteUrls, ...remoteUrls])]
                existing.forceRefresh ||= forceRefresh
                return true
            }
            if (pending.length >= MAX_PENDING_RESOLUTIONS) return false
            pending.push({ albumId, remoteUrls: [...new Set(remoteUrls)], forceRefresh })
            queueMicrotask(() => void drain())
            return true
        },

        getQueueStatus(): { pending: number; running: boolean } {
            return { pending: pending.length, running: draining }
        },

        async resolveConfirmed(): Promise<CoverResolutionBatchReport> {
            const albumIds = bindingRepo.findByState("confirmed")
                .map(binding => binding.library_album_id)
                .filter((albumId): albumId is string => albumId !== null)
                .slice(0, MAX_ALBUMS_PER_BATCH)
            const report: CoverResolutionBatchReport = {
                attempted: albumIds.length,
                local: 0,
                cached: 0,
                missing: 0,
                failed: 0,
            }
            for (const albumId of albumIds) {
                try {
                    const result = await resolveOne(albumId)
                    if (result.source === "folder" || result.source === "embedded") report.local++
                    else if (result.status === "cached") report.cached++
                    else report.missing++
                } catch {
                    report.failed++
                }
            }
            lastReport = report
            return report
        },

        getLastReport(): CoverResolutionBatchReport | null {
            return lastReport
        },
    }
}

export type CoverResolutionBatchService = ReturnType<typeof createCoverResolutionBatchService>
