import type {
    RotationCandidate,
    RotationPlan,
    RotationPlanItem,
    RotationRoleQuota,
} from "./types"

import {
    defaultRotationRoleQuotas,
    defaultRotationTargetSize,
} from "./rotationPlan"

export interface GenerateRotationPlanOptions {

    id?: string

    name?: string

    targetSize?: number

    roleQuotas?: RotationRoleQuota[]

    createdAt?: string

    previousAlbumIds?: string[]

}

export interface GenerateRotationPlanDeps {
    random: () => number
    generateId: () => string
}

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

function weightedShuffle(
    candidates: RotationCandidate[],
    previousAlbumIds: Set<string>,
    random: () => number,
): RotationCandidate[] {
    const now = Date.now()
    return candidates.map(candidate => {
        const daysSinceListen = candidate.lastListened
            ? Math.max(0, (now - getLastListenedTime(candidate)) / 86_400_000)
            : 365
        const listeningWeight = 1 / (1 + Math.max(0, candidate.listenCount) * .2)
        const recencyWeight = 1 + Math.min(daysSinceListen, 365) / 365
        const continuityWeight = previousAlbumIds.has(candidate.id) ? .2 : 1
        const weight = Math.max(.01, listeningWeight * recencyWeight * continuityWeight)
        // Efraimidis–Spirakis weighted sampling without replacement.
        const key = Math.pow(Math.max(random(), Number.EPSILON), 1 / weight)
        return { candidate, key }
    }).sort((a, b) => b.key - a.key).map(entry => entry.candidate)
}

export function generateRotationPlan(
    candidates: RotationCandidate[],
    options: GenerateRotationPlanOptions = {},
    deps: GenerateRotationPlanDeps,
): RotationPlan {

    const targetSize =
        options.targetSize ?? defaultRotationTargetSize

    const roleQuotas =
        options.roleQuotas ?? defaultRotationRoleQuotas

    const createdAt =
        options.createdAt ?? new Date().toISOString()

    const eligibleCandidates =
        candidates.filter(candidate =>
            candidate.category !== undefined &&
            ROTATION_ELIGIBLE_ROLES.has(candidate.category)
        )

    const previousAlbumIds = new Set(options.previousAlbumIds ?? [])

    const selected = new Set<string>()

    const items: RotationPlanItem[] = []

    for (const quota of roleQuotas) {

        const availableSlots =
            Math.max(targetSize - items.length, 0)

        if (availableSlots === 0) {

            break

        }

        const pool = eligibleCandidates.filter(candidate =>
            candidate.category === quota.role &&
            !selected.has(candidate.id)
        )

        const shuffled = weightedShuffle(pool, previousAlbumIds, deps.random)

        for (
            const candidate of shuffled.slice(
                0,
                Math.min(quota.targetCount, availableSlots),
            )
        ) {

            selected.add(candidate.id)

            items.push({
                albumId: candidate.id,
                role: quota.role,
                reason: "quota",
            })

        }

    }

    const remainingSlots = Math.max(targetSize - items.length, 0)
    if (remainingSlots > 0) {
        const fillPool = eligibleCandidates.filter(candidate => !selected.has(candidate.id))
        const fillCandidates = weightedShuffle(fillPool, previousAlbumIds, deps.random)
        for (const candidate of fillCandidates.slice(0, remainingSlots)) {
            selected.add(candidate.id)
            items.push({
                albumId: candidate.id,
                role: candidate.category,
                reason: "fill",
            })
        }
    }

    return {

        id: options.id ?? deps.generateId(),

        name: options.name ?? "Player-Rotation",

        targetSize,

        albumIds:
            items.map(item => item.albumId),

        items,

        roleQuotas,

        createdAt,

        status: "draft",

    }

}