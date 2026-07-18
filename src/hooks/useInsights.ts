import { useCallback,useEffect,useState } from "react"
import { fetchInsights,type InsightsResponse } from "../services/api/insightsService.js"

export function useInsights(enabled:boolean) {
    const [data,setData]=useState<InsightsResponse|null>(null),[isLoading,setIsLoading]=useState(enabled),[error,setError]=useState<string|null>(null)
    const refresh=useCallback(async()=>{
        if(!enabled)return false
        setIsLoading(true)
        try{setData(await fetchInsights());setError(null);return true}catch(cause){setError(cause instanceof Error?cause.message:"Insights request failed");return false}finally{setIsLoading(false)}
    },[enabled])
    useEffect(()=>{if(enabled)queueMicrotask(()=>void refresh());else queueMicrotask(()=>setIsLoading(false))},[enabled,refresh])
    return {data,isLoading,error,refresh}
}
