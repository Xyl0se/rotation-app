import { useCallback, useEffect, useState } from "react"
import { dismissReflection, evaluateReflections, resolveReflection, snoozeReflection, type ReflectionInboxItem } from "../services/api/reflectionService"

export function useReflectionInbox(enabled:boolean) {
    const [items,setItems]=useState<ReflectionInboxItem[]>([])
    const [isLoading,setIsLoading]=useState(enabled)
    const [error,setError]=useState<string|null>(null)
    const refresh=useCallback(async()=>{
        if(!enabled)return
        setIsLoading(true);setError(null)
        try{setItems((await evaluateReflections()).items)}catch(value){setError(value instanceof Error?value.message:String(value))}finally{setIsLoading(false)}
    },[enabled])
    useEffect(()=>{
        if(!enabled)return
        let cancelled=false
        void evaluateReflections().then(result=>{if(!cancelled){setItems(result.items);setError(null)}})
            .catch(value=>{if(!cancelled)setError(value instanceof Error?value.message:String(value))})
            .finally(()=>{if(!cancelled)setIsLoading(false)})
        return()=>{cancelled=true}
    },[enabled])
    const remove=(id:string)=>setItems(current=>current.filter(item=>item.id!==id))
    const run=async(action:()=>Promise<unknown>,id:string)=>{setError(null);try{await action();remove(id);return true}catch(value){setError(value instanceof Error?value.message:String(value));return false}}
    return {items,isLoading,error,refresh,
        snooze:(id:string,days:number)=>run(()=>snoozeReflection(id,new Date(Date.now()+days*86_400_000).toISOString()),id),
        dismiss:(id:string)=>run(()=>dismissReflection(id),id),
        resolve:(id:string,resolution:string)=>run(()=>resolveReflection(id,resolution),id),
    }
}
