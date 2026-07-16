import type { Album } from "../../types/album"
import { generateUUID } from "../../utils/uuid"

import type {
    RoleId,
} from "../roles"

import {
    defaultRotationRoleQuotas,
    defaultRotationTargetSize,
    type RotationPlan,
    type RotationPlanItem,
    type RotationRoleQuota,
} from "./rotationPlan"

export interface GenerateRotationPlanOptions {

    id?: string

    name?: string

    targetSize?: number

    roleQuotas?: RotationRoleQuota[]

    createdAt?: string

    previousAlbumIds?: string[]

    random?: () => number

}

const ROTATION_ROLES = new Set<RoleId>(["new", "growing", "comfort-food", "classic"])

function getLastListenedTime(album: Album): number {

    if (!album.lastListened) {

        return 0

    }

    return new Date(album.lastListened).getTime()

}

function weightedShuffle(
    albums: Album[],
    previousAlbumIds: Set<string>,
    random: () => number,
): Album[] {
    const now = Date.now()
    return albums.map(album => {
        const daysSinceListen = album.lastListened
            ? Math.max(0, (now - getLastListenedTime(album)) / 86_400_000)
            : 365
        const listeningWeight = 1 / (1 + Math.max(0, album.listenCount) * .2)
        const recencyWeight = 1 + Math.min(daysSinceListen, 365) / 365
        const continuityWeight = previousAlbumIds.has(album.id) ? .2 : 1
        const weight = Math.max(.01, listeningWeight * recencyWeight * continuityWeight)
        // Efraimidis–Spirakis weighted sampling without replacement.
        const key = Math.pow(Math.max(random(), Number.EPSILON), 1 / weight)
        return { album, key }
    }).sort((a, b) => b.key - a.key).map(entry => entry.album)
}

export function generateRotationPlan(
    albums: Album[],
    options: GenerateRotationPlanOptions = {},
): RotationPlan {

    const targetSize =
        options.targetSize ?? defaultRotationTargetSize

    const roleQuotas =
        options.roleQuotas ?? defaultRotationRoleQuotas

    const createdAt =
        options.createdAt ?? new Date().toISOString()

    const eligibleAlbums =
        albums.filter(album =>
            album.category !== undefined && ROTATION_ROLES.has(album.category)
        )

    const previousAlbumIds = new Set(options.previousAlbumIds ?? [])
    const random = options.random ?? Math.random

    const selected = new Set<string>()

    const items: RotationPlanItem[] = []

    for (const quota of roleQuotas) {

        const availableSlots =
            Math.max(targetSize - items.length, 0)

        if (availableSlots === 0) {

            break

        }

        const candidates =
            weightedShuffle(
                eligibleAlbums.filter(album =>
                    album.category === quota.role &&
                    !selected.has(album.id)
                ),
                previousAlbumIds,
                random,
            )

        for (
            const album of candidates.slice(
                0,
                Math.min(quota.targetCount, availableSlots),
            )
        ) {

            selected.add(album.id)

            items.push({
                albumId: album.id,
                role: quota.role,
                reason: "quota",
            })

        }

    }

    const remainingSlots = Math.max(targetSize - items.length, 0)
    if (remainingSlots > 0) {
        const fillCandidates = weightedShuffle(
            eligibleAlbums.filter(album => !selected.has(album.id)),
            previousAlbumIds,
            random,
        )
        for (const album of fillCandidates.slice(0, remainingSlots)) {
            selected.add(album.id)
            items.push({
                albumId: album.id,
                role: album.category as RoleId,
                reason: "fill",
            })
        }
    }

    return {

        id: options.id ?? generateUUID(),

        name: options.name ?? "Player-Rotation",

        targetSize,

        albumIds:
            items.map(item => item.albumId),

        items,

        roleQuotas,

        createdAt,

        status: "draft" as const,

    }

}
