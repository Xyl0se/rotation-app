import type { BindingRepository } from "../infrastructure/persistence/sqlite/bindingRepository.js"
import type { CoverResolver, CoverResolverResult } from "./coverResolver.js"

const MAX_ALBUMS_PER_BATCH = 25

export interface CoverResolutionBatchReport {
    attempted: number
    local: number
    cached: number
    missing: number
    failed: number
}

export function createCoverResolutionBatchService(bindingRepo: BindingRepository, coverResolver: CoverResolver) {
    let lastReport: CoverResolutionBatchReport | null = null

    async function resolveOne(albumId: string): Promise<CoverResolverResult> {
        return coverResolver.resolve(albumId)
    }

    return {
        resolveOne,

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
