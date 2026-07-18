import { Router } from "express"
import type { InsightsService } from "../application/insightsService.js"

export function createInsightsRouter(service:InsightsService):Router {
    const router=Router()
    router.get("/",(_req,res)=>res.json(service.evaluate()))
    return router
}
