import { Router } from "express"
import type { ReflectionInboxService } from "../application/reflectionInboxService.js"
import type { AuditRepository } from "../infrastructure/persistence/sqlite/auditRepository.js"
import { ReflectionResolutionSchema, ReflectionSnoozeSchema, UUIDSchema, parseRequest } from "./validation.js"

export function createReflectionsRouter(service:ReflectionInboxService,audit?:AuditRepository):Router {
    const router=Router()
    router.get("/",(_req,res)=>res.json({items:service.list()}))
    router.post("/evaluate",(_req,res)=>res.json({items:service.evaluate()}))
    router.post("/:id/snooze",(req,res)=>{
        const id=parseRequest(UUIDSchema,req.params.id,res);if(!id)return
        const body=parseRequest(ReflectionSnoozeSchema,req.body,res);if(!body)return
        const item=service.snooze(id,body.until); return item ? res.json(item) : res.status(404).json({error:"Reflection item not found"})
    })
    router.post("/:id/dismiss",(req,res)=>{const id=parseRequest(UUIDSchema,req.params.id,res);if(!id)return;const item=service.dismiss(id);return item?res.json(item):res.status(404).json({error:"Reflection item not found"})})
    router.post("/:id/resolve",(req,res)=>{
        const id=parseRequest(UUIDSchema,req.params.id,res);if(!id)return
        const body=parseRequest(ReflectionResolutionSchema,req.body,res);if(!body)return
        const before=service.list().find(item=>item.id===id)
        const item=service.resolve(id,body.resolution)
        if(item && before)audit?.record("reflection-resolved",item.albumId,before,item)
        return item?res.json(item):res.status(404).json({error:"Reflection item not found"})
    })
    return router
}
