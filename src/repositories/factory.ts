import type { StorageAdapter } from "../adapters/storageAdapter"

import { STORAGE } from "../config/storage"

import { createRotationPlanRepository } from "./rotationPlanRepository"
import { createListenEventRepository } from "./listenEventRepository"

export interface RepositoryKeys {
    rotationPlan: {
        draft: string
        active: string
    }
    listenEvents: string
}

export function createRepositories(
    adapter: StorageAdapter,
    keys: RepositoryKeys = {
        rotationPlan: {
            draft: STORAGE.CURRENT_ROTATION_PLAN,
            active: STORAGE.ACTIVE_ROTATION_PLAN,
        },
        listenEvents: STORAGE.LISTEN_EVENTS,
    },
) {
    return {
        rotationPlan: createRotationPlanRepository(
            adapter,
            keys.rotationPlan.draft,
            keys.rotationPlan.active,
        ),
        listenEvents: createListenEventRepository(adapter, keys.listenEvents),
    }
}

export type Repositories = ReturnType<typeof createRepositories>
