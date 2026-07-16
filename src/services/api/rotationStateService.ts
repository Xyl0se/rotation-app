import type { RotationPlan } from "../../domain/rotation-plan/rotationPlan"
import type { ListenEvent } from "../../domain/listening/listenEvents"
import { get, post, put } from "./apiClient"

export interface ServerRotationPlan extends RotationPlan {
    focusAlbumId: string | null
}

export interface RotationStateResponse {
    active: ServerRotationPlan | null
    draft: ServerRotationPlan | null
}

export interface LegacyRotationImport extends RotationStateResponse {
    listenEvents: ListenEvent[]
}

export function fetchRotationState(): Promise<RotationStateResponse> {
    return get("/rotation-state")
}

export function saveRotationPlan(plan: RotationPlan, focusAlbumId: string | null = null): Promise<ServerRotationPlan> {
    return put("/rotation-state/plan", { ...plan, focusAlbumId })
}

export function setServerFocus(albumId: string | null): Promise<ServerRotationPlan> {
    return put("/rotation-state/focus", { albumId })
}

export function chooseRandomServerFocus(): Promise<ServerRotationPlan> {
    return post("/rotation-state/focus/random")
}

export function fetchListenEvents(): Promise<ListenEvent[]> {
    return get("/rotation-state/listens")
}

export function createListenEvent(event: ListenEvent): Promise<ListenEvent> {
    return post("/rotation-state/listens", event)
}

export function importLegacyRotationState(payload: {
    draft?: RotationPlan | null
    active?: RotationPlan | null
    listenEvents: ListenEvent[]
    focusAlbumId?: string | null
}): Promise<LegacyRotationImport> {
    return post("/rotation-state/legacy-import", {
        draft: payload.draft ? { ...payload.draft, focusAlbumId: null } : null,
        active: payload.active ? {
            ...payload.active,
            focusAlbumId: payload.focusAlbumId && payload.active.albumIds.includes(payload.focusAlbumId)
                ? payload.focusAlbumId
                : null,
        } : null,
        listenEvents: payload.listenEvents,
    })
}
