import { get, post } from "./apiClient"
export interface AuditEvent { id:string;eventType:"album-role-changed";entityId:string;createdAt:string;undoneAt:string|null }
export const fetchAuditEvents = (): Promise<{ events: AuditEvent[] }> => get("/audit")
export const undoLastAuditEvent = (): Promise<AuditEvent> => post("/audit/undo")
