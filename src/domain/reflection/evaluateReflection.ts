import type { Album } from "../../types/album"

import {
    getCurrentRoleHistoryEntry,
    getRoleSince,
} from "../album/roleHistoryHelpers"

import {
    reflectionRules,
    type ReflectionRule,
    type ReflectionRuleCode,
} from "./reflectionRules"

export interface ReflectionPrompt {

    album: Album

    code: ReflectionRuleCode

}

export interface ReflectionEvaluation {

    prompts: ReflectionPrompt[]

}

/**
 * Checks whether an album matches a given reflection rule.
 *
 * The check considers:
 * - current role of the album
 * - whether the last role change already came via reflection
 * - minimum listen count
 * - minimum days in the current role
 * - minimum days since last listen session
 */

function daysBetween(
    start: string,
    end: Date,
): number {

    const startTime =
        new Date(start).getTime()

    if (Number.isNaN(startTime)) {

        return 0

    }

    const millisecondsPerDay =
        1000 * 60 * 60 * 24

    return Math.floor(
        (end.getTime() - startTime) / millisecondsPerDay,
    )

}

function matchesRule(
    album: Album,
    rule: ReflectionRule,
    now: Date,
): boolean {

    const currentRoleEntry =
        getCurrentRoleHistoryEntry(album)

    if (album.category !== rule.role) {

        return false

    }

    if (currentRoleEntry?.source === "reflection") {

        return false

    }

    if (
        rule.minimumListenCount !== undefined &&
        album.listenCount < rule.minimumListenCount
    ) {

        return false

    }

    if (rule.minimumDaysInRole !== undefined) {

        const roleSince =
            getRoleSince(album)

        if (!roleSince) {

            return false

        }

        if (
            daysBetween(roleSince, now) <
            rule.minimumDaysInRole
        ) {

            return false

        }

    }

    if (rule.minimumDaysSinceListen !== undefined) {

        if (!album.lastListened) {

            return false

        }

        if (
            daysBetween(album.lastListened, now) <
            rule.minimumDaysSinceListen
        ) {

            return false

        }

    }

    return true

}

export function evaluateReflection(
    albums: Album[],
    now = new Date(),
): ReflectionEvaluation {

    const prompts =
        reflectionRules.flatMap(rule =>
            albums
                .filter(album =>
                    matchesRule(
                        album,
                        rule,
                        now,
                    )
                )
                .map(album => ({

                    album,

                    code: rule.code,

                }))
        )

    return {

        prompts,

    }

}
