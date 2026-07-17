import { act,renderHook,waitFor } from "@testing-library/react"
import { beforeEach,describe,expect,it,vi } from "vitest"
import { useReflectionInbox } from "./useReflectionInbox"
import { dismissReflection,evaluateReflections,resolveReflection,snoozeReflection } from "../services/api/reflectionService"

vi.mock("../services/api/reflectionService",()=>({evaluateReflections:vi.fn(),snoozeReflection:vi.fn(),dismissReflection:vi.fn(),resolveReflection:vi.fn()}))
const item={id:"item",albumId:"album",albumTitle:"Title",albumArtist:"Artist",ruleCode:"new-after-listens" as const,state:"open" as const,evidence:{role:"new",listenCount:3,lastListened:null,roleSince:null,daysInRole:100,daysSinceListen:null,recentRotationCount:0},createdAt:"2026-01-01T00:00:00.000Z",dueAt:"2026-01-01T00:00:00.000Z",snoozedUntil:null,resolvedAt:null,resolution:null}

describe("useReflectionInbox",()=>{
    beforeEach(()=>{vi.clearAllMocks();vi.mocked(evaluateReflections).mockResolvedValue({items:[item]});vi.mocked(snoozeReflection).mockResolvedValue({...item,state:"snoozed"});vi.mocked(dismissReflection).mockResolvedValue({...item,state:"dismissed"});vi.mocked(resolveReflection).mockResolvedValue({...item,state:"resolved"})})
    it("loads server state and removes a successfully snoozed item",async()=>{
        const {result}=renderHook(()=>useReflectionInbox(true));await waitFor(()=>expect(result.current.items).toHaveLength(1))
        await act(()=>result.current.snooze("item",30));expect(result.current.items).toEqual([]);expect(snoozeReflection).toHaveBeenCalledOnce()
    })
    it("keeps an item and exposes an action failure",async()=>{
        vi.mocked(dismissReflection).mockRejectedValue(new Error("offline"));const {result}=renderHook(()=>useReflectionInbox(true));await waitFor(()=>expect(result.current.items).toHaveLength(1))
        await act(()=>result.current.dismiss("item"));expect(result.current.items).toHaveLength(1);expect(result.current.error).toBe("offline")
    })
    it("does not load while the server connection is disabled",()=>{
        const {result}=renderHook(()=>useReflectionInbox(false));expect(result.current.items).toEqual([]);expect(evaluateReflections).not.toHaveBeenCalled()
    })
})
