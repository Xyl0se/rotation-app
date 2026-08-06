import type { Album } from "../types/album"
import type { RotationCandidate, RotationEligibleRole } from "@rotation/domain"

const ROTATION_ELIGIBLE_ROLES = new Set<RotationEligibleRole>([
    "new",
    "growing",
    "comfort-food",
    "classic",
])

function isRotationEligibleRole(role: string): role is RotationEligibleRole {
    return ROTATION_ELIGIBLE_ROLES.has(role as RotationEligibleRole)
}

export function toRotationCandidate(album: Album): RotationCandidate | null {
    if (!album.category || !isRotationEligibleRole(album.category)) {
        return null
    }
    return {
        id: album.id,
        title: album.title,
        category: album.category,
        listenCount: album.listenCount,
        lastListened: album.lastListened,
    }
}
