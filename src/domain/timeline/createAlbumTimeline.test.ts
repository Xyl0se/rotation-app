import { describe,expect,it } from "vitest"
import { createAlbumTimeline } from "./createAlbumTimeline"

describe("album timeline journal context",()=>{
    it("derives the role at listening time without using a later role",()=>{
        const album={id:"album",title:"Album",artist:"Artist",year:"2026",category:"classic" as const,listenCount:1,lastListened:"2026-03-01T00:00:00.000Z",roleHistory:[{role:"new" as const,recordedAt:"2026-01-01T00:00:00.000Z",source:"coach" as const},{role:"classic" as const,recordedAt:"2026-04-01T00:00:00.000Z",source:"reflection" as const}]}
        const journal={note:"Still discovering",moodTags:["curious" as const],contextTags:["focused" as const],createdAt:"2026-03-01T00:00:00.000Z",updatedAt:"2026-03-01T00:00:00.000Z"}
        const [listen]=createAlbumTimeline(album,[{id:"listen",albumId:"album",listenedAt:"2026-03-01T00:00:00.000Z",journal}]).filter(event=>event.type==="listened")
        expect(listen).toMatchObject({roleAtTime:"new",journal})
    })
})
