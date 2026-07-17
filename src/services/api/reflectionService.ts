import { get, post } from "./apiClient"

export type ReflectionRuleCode="new-after-listens"|"growing-for-a-while"|"comfort-not-recent"|"archive-return-candidate"|"never-heard-dormant"|"rotation-absent-dormant"
export interface ReflectionInboxItem {id:string;albumId:string;albumTitle:string;albumArtist:string;albumCoverUrl?:string;ruleCode:ReflectionRuleCode;state:"open"|"snoozed"|"resolved"|"dismissed";evidence:{role:string;listenCount:number;lastListened:string|null;roleSince:string|null;daysInRole:number|null;daysSinceListen:number|null;recentRotationCount:number;archiveTemperature?:"warm"|"cold"};createdAt:string;dueAt:string;snoozedUntil:string|null;resolvedAt:string|null;resolution:string|null}
export const fetchReflections = (): Promise<{ items: ReflectionInboxItem[] }> => get("/reflections")
export const evaluateReflections = (): Promise<{ items: ReflectionInboxItem[] }> => post("/reflections/evaluate")
export const snoozeReflection=(id:string,until:string):Promise<ReflectionInboxItem>=>post(`/reflections/${id}/snooze`,{until})
export const dismissReflection=(id:string):Promise<ReflectionInboxItem>=>post(`/reflections/${id}/dismiss`)
export const resolveReflection=(id:string,resolution:string):Promise<ReflectionInboxItem>=>post(`/reflections/${id}/resolve`,{resolution})
