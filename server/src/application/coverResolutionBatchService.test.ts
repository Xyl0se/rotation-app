import { describe, expect, it, vi } from "vitest"
import { createCoverResolutionBatchService } from "./coverResolutionBatchService.js"
import type { BindingRepository } from "../infrastructure/persistence/sqlite/bindingRepository.js"
import type { CoverResolver } from "./coverResolver.js"

describe("cover resolution batch service", () => {
    it("processes confirmed linked albums sequentially and summarizes safe outcomes", async () => {
        const bindings = Array.from({ length: 30 }, (_, index) => ({
            library_album_id: `album-${index}`,
        }))
        const bindingRepo = { findByState: () => bindings } as unknown as BindingRepository
        let active = 0
        let maxActive = 0
        const resolve = vi.fn(async (albumId: string) => {
            active++
            maxActive = Math.max(maxActive, active)
            await Promise.resolve()
            active--
            const index = Number(albumId.split("-")[1])
            if (index === 3) throw new Error("private parser detail")
            if (index % 3 === 0) return { status: "not-found" as const, source: "placeholder" as const }
            if (index % 2 === 0) return { status: "cached" as const, source: "folder" as const }
            return { status: "cached" as const, source: "cache" as const }
        })
        const coverResolver = { resolve } as unknown as CoverResolver

        const report = await createCoverResolutionBatchService(bindingRepo, coverResolver).resolveConfirmed()

        expect(report.attempted).toBe(25)
        expect(resolve).toHaveBeenCalledTimes(25)
        expect(maxActive).toBe(1)
        expect(report.local + report.cached + report.missing + report.failed).toBe(25)
        expect(report.failed).toBe(1)
        expect(JSON.stringify(report)).not.toContain("private")
    })

    it("resolves a single confirmed album for capture and confirmation hooks", async () => {
        const bindingRepo = { findByState: () => [] } as unknown as BindingRepository
        const resolve = vi.fn(async () => ({ status: "cached" as const, source: "embedded" as const }))
        const service = createCoverResolutionBatchService(
            bindingRepo,
            { resolve } as unknown as CoverResolver,
        )

        await expect(service.resolveOne("album-id")).resolves.toEqual({ status: "cached", source: "embedded" })
        expect(resolve).toHaveBeenCalledWith("album-id")
    })
})
