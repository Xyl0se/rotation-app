import type { RotationPlan } from "../../domain/rotation-plan/rotationPlan"
import type { ListenEvent } from "../../domain/listening/listenEvents"
import { get, post, put } from "./apiClient"
import type { RotationRoleQuota } from "../../domain/rotation-plan/rotationPlan"

export interface ServerRotationPlan extends RotationPlan {
    focusAlbumId: string | null
}

export interface RotationStateResponse {
    active: ServerRotationPlan | null
    draft: ServerRotationPlan | null
}
export interface RotationSettings { targetSize: number; roleQuotas: RotationRoleQuota[] }
export interface RotationHistoryResponse { items: ServerRotationPlan[]; total: number; limit: number; offset: number }
export interface RotationHandoverPreview { draftId:string;activeId:string|null;entering:string[];leaving:string[];unchanged:string[];beforeRoles:Record<string,number>;afterRoles:Record<string,number>;quotaGaps:Record<string,number>;size:number;targetSize:number;missingBindings:string[];unconfirmedBindings:string[];estimatedSizeBytes:number;fileCount:number;exportReady:boolean }


export function fetchRotationState(): Promise<RotationStateResponse> {
    return get("/rotation-state")
}
export function fetchRotationSettings(): Promise<RotationSettings> { return get("/rotation-state/settings") }
export function fetchRotationHistory(limit = 20, offset = 0): Promise<RotationHistoryResponse> { return get(`/rotation-state/history?limit=${limit}&offset=${offset}`) }
export function createDraftFromHistory(id: string): Promise<ServerRotationPlan> { return post(`/rotation-state/history/${encodeURIComponent(id)}/draft`) }
export function fetchRotationHandover(): Promise<RotationHandoverPreview> { return get("/rotation-state/handover") }
export function saveRotationSettings(settings: RotationSettings): Promise<RotationSettings> { return put("/rotation-state/settings", settings) }

export function saveRotationPlan(plan: RotationPlan, focusAlbumId: string | null = null): Promise<ServerRotationPlan> {
    return put("/rotation-state/plan", { ...plan, focusAlbumId })
}

export function setServerFocus(albumId: string | null): Promise<ServerRotationPlan> {
    return put("/rotation-state/focus", { albumId })
}

export function chooseRandomServerFocus(): Promise<ServerRotationPlan> {
    return post("/rotation-state/focus/random")
}

export function fetchListenEvents(limit = 1_000): Promise<ListenEvent[]> {
    return get(`/rotation-state/listens?limit=${limit}`)
}

export function createListenEvent(event: ListenEvent): Promise<ListenEvent> {
    return post("/rotation-state/listens", event)
}
