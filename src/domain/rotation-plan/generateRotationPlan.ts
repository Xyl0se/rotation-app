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

}

const ROTATION_ROLES = new Set<RoleId>(["new", "growing", "comfort-food", "classic"])

function getLastListenedTime(album: Album): number {

    if (!album.lastListened) {

        return 0

    }

    return new Date(album.lastListened).getTime()

}

function sortCandidates(albums: Album[]): Album[] {

    return [...albums].sort((a, b) => {

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

    const selected = new Set<string>()

    const items: RotationPlanItem[] = []

    for (const quota of roleQuotas) {

        const availableSlots =
            Math.max(targetSize - items.length, 0)

        if (availableSlots === 0) {

            break

        }

        const candidates =
            sortCandidates(
                eligibleAlbums.filter(album =>
                    album.category === quota.role &&
                    !selected.has(album.id)
                ),
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
