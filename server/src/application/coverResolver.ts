import type { CoverService, CoverResolutionStatus } from "./coverService.js"
import type { LocalArtworkService, LocalArtworkSource } from "./localArtworkService.js"

export type ResolvedCoverSource = LocalArtworkSource | "upload" | "alternative" | "remote" | "cache" | "placeholder"
export interface CoverResolverResult { status: CoverResolutionStatus; source: ResolvedCoverSource }

export function createCoverResolver(coverService: CoverService, localArtworkService: LocalArtworkService) {
    return {
        async resolve(albumId: string, remoteUrls: string[] = [], forceRefresh = false): Promise<CoverResolverResult> {
            const previous = coverService.getMeta(albumId)
            if (previous?.source === "upload" || previous?.source === "alternative") {
                return { status: "cached", source: previous.source }
            }

            const local = await localArtworkService.findForAlbum(albumId).catch(() => null)
            if (local) {
                await coverService.saveValidatedCover(albumId, local.buffer, local.contentType, local.source)
                return { status: "cached", source: local.source }
            }

            if (coverService.getCoverPath(albumId) && !forceRefresh) {
                return { status: "cached", source: "cache" }
            }

            if (remoteUrls.length > 0) {
                const result = await coverService.resolveRemoteCover(albumId, remoteUrls)
                return { ...result, source: result.status === "cached" ? "remote" : (coverService.getCoverPath(albumId) ? "cache" : "placeholder") }
            }

            if (coverService.getCoverPath(albumId)) return { status: "cached", source: "cache" }
            return { status: "not-found", source: "placeholder" }
        },
    }
}

export type CoverResolver = ReturnType<typeof createCoverResolver>
