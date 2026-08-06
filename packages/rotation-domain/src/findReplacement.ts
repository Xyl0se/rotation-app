import type {
    RotationCandidate,
    RotationPlan,
    RotationPlanItem,
} from "./types.js"

const ROTATION_ELIGIBLE_ROLES = new Set([
    "new",
    "growing",
    "comfort-food",
    "classic",
] as const)

function getLastListenedTime(candidate: RotationCandidate): number {

    if (!candidate.lastListened) {

        return 0

    }

    return new Date(candidate.lastListened).getTime()

}

function sortCandidates(candidates: RotationCandidate[]): RotationCandidate[] {

    return [...candidates].sort((a, b) => {

        const listenDifference =
            a.listenCount - b.listenCount

        if (listenDifference !== 0) {

            return listenDifference

        }

        const listenedDifference =
            getLastListenedTime(a) -
            getLastListenedTime(b)

        if (listenedDifference !== 0) {

            return listenedDifference

        }

        return a.title.localeCompare(b.title)

    })

}

export function findReplacementCandidates(
    removedItem: RotationPlanItem,
    plan: RotationPlan,
    candidates: RotationCandidate[],
    limit = 3,
): RotationCandidate[] {

    const selectedIds = new Set(
        plan.items.map(item => item.albumId)
    )

    const pool = candidates.filter(candidate =>
        candidate.id !== removedItem.albumId &&
        !selectedIds.has(candidate.id) &&
        candidate.category === removedItem.role &&
        ROTATION_ELIGIBLE_ROLES.has(candidate.category)
    )

    return sortCandidates(pool).slice(0, limit)

}
