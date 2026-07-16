import type { Album } from "../../types/album"

import type {
    RotationPlan,
    RotationPlanItem,
} from "./rotationPlan"

const ROTATION_ROLES = new Set(["new", "growing", "comfort-food"])

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

export function findReplacementCandidates(
    removedItem: RotationPlanItem,
    plan: RotationPlan,
    albums: Album[],
    limit = 3,
): Album[] {

    const selectedIds = new Set(
        plan.items.map(item => item.albumId)
    )

    const candidates =
        sortCandidates(
            albums.filter(album =>
                album.id !== removedItem.albumId &&
                !selectedIds.has(album.id) &&
                album.category === removedItem.role &&
                ROTATION_ROLES.has(album.category)
            )
        )

    return candidates.slice(0, limit)

}
