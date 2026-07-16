import type { Album } from "../../types/album"

import type { RoleId } from "../roles"

export type InsightCode =
    | "building-library"
    | "discovery-phase"
    | "archive-heavy"
    | "comfort-heavy"
    | "classic-core"

export interface Insight {
    code: InsightCode
    priority: "info" | "reflection"
}

function countRole(
    albums: Album[],
    role: RoleId,
): number {
    return albums.filter(album =>
        album.category === role
    ).length
}

function ratio(
    count: number,
    total: number,
): number {
    if (total === 0) {
        return 0
    }

    return count / total
}

export function evaluateInsights(
    albums: Album[],
): Insight[] {
    const total = albums.length

    if (total < 3) {
        return [
            {
                code: "building-library",
                priority: "info",
            },
        ]
    }

    const archiveCount = countRole(albums, "archive")
    const newCount = countRole(albums, "new")
    const growingCount = countRole(albums, "growing")
    const comfortCount = countRole(albums, "comfort-food")
    const classicCount = countRole(albums, "classic")

    const insights: Insight[] = []

    if (ratio(newCount + growingCount, total) >= 0.4) {
        insights.push({
            code: "discovery-phase",
            priority: "info",
        })
    }

    if (ratio(archiveCount, total) >= 0.3) {
        insights.push({
            code: "archive-heavy",
            priority: "reflection",
        })
    }

    if (ratio(comfortCount, total) >= 0.3) {
        insights.push({
            code: "comfort-heavy",
            priority: "info",
        })
    }

    if (
        classicCount >= 5 ||
        ratio(classicCount, total) >= 0.2
    ) {
        insights.push({
            code: "classic-core",
            priority: "info",
        })
    }

    return insights.slice(0, 3)
}
