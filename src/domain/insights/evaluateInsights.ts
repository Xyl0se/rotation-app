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
    title: string
    description: string
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
                title: "Your collection is taking shape",
                description:
                    "With a few more albums, Rotation can start recognizing first patterns in your collection.",
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
            title: "You're in a discovery phase",
            description:
                "Many albums in your collection still want to grow or be discovered.",
        })
    }

    if (ratio(archiveCount, total) >= 0.3) {
        insights.push({
            code: "archive-heavy",
            priority: "reflection",
            title: "A noticeable part of your collection is resting",
            description:
                "The archive has gained weight. Maybe there's a rediscovery candidate in there soon.",
        })
    }

    if (ratio(comfortCount, total) >= 0.3) {
        insights.push({
            code: "comfort-heavy",
            priority: "info",
            title: "Your collection is seeking familiarity",
            description:
                "Comfort-food albums are taking up a lot of space right now. This can be a very stable listening phase.",
        })
    }

    if (
        classicCount >= 5 ||
        ratio(classicCount, total) >= 0.2
    ) {
        insights.push({
            code: "classic-core",
            priority: "info",
            title: "Your collection has a clear classic core",
            description:
                "A part of your collection now feels permanently formative.",
        })
    }

    return insights.slice(0, 3)
}
