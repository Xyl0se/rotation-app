import { Router } from "express"
import type { AuditRepository } from "../infrastructure/persistence/sqlite/auditRepository.js"
export function createAuditRouter(repository: AuditRepository): Router {
    const router=Router()
    router.get("/",(_req,res)=>res.json({events:repository.list()}))
    router.get("/undo-preview",(_req,res)=>{try{res.json(repository.previewUndo())}catch(error){res.status(409).json({error:error instanceof Error?error.message:"UNDO_CONFLICT"})}})
    router.post("/undo",(_req,res)=>{try{res.json(repository.undoLast())}catch(error){res.status(409).json({error:error instanceof Error?error.message:"UNDO_CONFLICT"})}})
    return router
}
