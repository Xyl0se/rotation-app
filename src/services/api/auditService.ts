import { get, post } from "./apiClient"
export type AuditEventType = "album-role-changed" | "binding-reassigned" | "draft-item-removed" | "draft-item-replaced" | "rotation-accepted" | "album-role-change-undone"
export interface AuditAlbumSnapshot { title?: string; artist?: string; category?: string }
export interface AuditEvent { id:string;eventType:AuditEventType;entityId:string;before:AuditAlbumSnapshot;after:AuditAlbumSnapshot;createdAt:string;undoneAt:string|null }
export const fetchAuditEvents = (): Promise<{ events: AuditEvent[] }> => get("/audit")
export const fetchUndoPreview = (): Promise<AuditEvent> => get("/audit/undo-preview")
export const undoLastAuditEvent = (): Promise<AuditEvent> => post("/audit/undo")
