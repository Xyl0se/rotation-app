import type { RotationCandidate } from "../types"

export function makeCandidate(
    partial: Partial<RotationCandidate> = {},
): RotationCandidate {

    return {

        id: "test-candidate-1",

        title: "Test Album",

        category: "new",

        listenCount: 0,

        lastListened: null,

        ...partial,

    }

}