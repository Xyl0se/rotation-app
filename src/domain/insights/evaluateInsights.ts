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

    const total =
        albums.length

    if (total < 3) {

        return [

            {

                code: "building-library",

                priority: "info",

                title:
                    "Deine Sammlung entsteht gerade",

                description:
                    "Mit ein paar weiteren Alben kann Rotation erste Muster in deiner Sammlung erkennen.",

            },

        ]

    }

    const archiveCount =
        countRole(albums, "archive")

    const newCount =
        countRole(albums, "new")

    const growingCount =
        countRole(albums, "growing")

    const comfortCount =
        countRole(albums, "comfort-food")

    const classicCount =
        countRole(albums, "classic")

    const insights: Insight[] = []

    if (ratio(newCount + growingCount, total) >= 0.4) {

        insights.push({

            code: "discovery-phase",

            priority: "info",

            title:
                "Du bist gerade in einer Entdeckungsphase",

            description:
                "Viele Alben in deiner Sammlung wollen noch wachsen oder erst kennengelernt werden.",

        })

    }

    if (ratio(archiveCount, total) >= 0.3) {

        insights.push({

            code: "archive-heavy",

            priority: "reflection",

            title:
                "Ein spürbarer Teil deiner Sammlung ruht",

            description:
                "Das Archiv hat Gewicht bekommen. Vielleicht ist darin bald wieder ein Kandidat für Wiederentdeckung.",

        })

    }

    if (ratio(comfortCount, total) >= 0.3) {

        insights.push({

            code: "comfort-heavy",

            priority: "info",

            title:
                    "Deine Sammlung sucht gerade Vertrautheit",

            description:
                "Comfort-Food-Alben nehmen gerade viel Raum ein. Das kann eine sehr stabile Hörphase sein.",

        })

    }

    if (
        classicCount >= 5 ||
        ratio(classicCount, total) >= 0.2
    ) {

        insights.push({

            code: "classic-core",

            priority: "info",

            title:
                "Deine Sammlung hat einen klaren Klassiker-Kern",

            description:
                    "Ein Teil deiner Sammlung wirkt inzwischen dauerhaft prägend.",

        })

    }

    return insights.slice(0, 3)

}
