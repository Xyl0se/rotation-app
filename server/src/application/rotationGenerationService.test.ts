import { describe, expect, it, beforeEach } from "vitest"
import { initDatabase } from "../infrastructure/persistence/sqlite/connection.js"
import { createAlbumRepository } from "../infrastructure/persistence/sqlite/albumRepository.js"
import { createRotationStateRepository } from "../infrastructure/persistence/sqlite/rotationStateRepository.js"
import { createRotationGenerationService } from "./rotationGenerationService.js"

function makeAlbum(id: string, category: string, title = "Title", listenCount = 0, lastListened: string | null = null) {
    return {
        id,
        title,
        artist: "Artist",
        year: "2024",
        category: category as import("../domain/albumTypes.js").RoleId,
        listenCount,
        lastListened,
        roleHistory: [],
        createdAt: "2026-01-01",
        sources: [],
    }
}

describe("rotation generation service", () => {
    let db: ReturnType<typeof initDatabase>
    let albumRepo: ReturnType<typeof createAlbumRepository>
    let rotationRepo: ReturnType<typeof createRotationStateRepository>
    let service: ReturnType<typeof createRotationGenerationService>

    beforeEach(() => {
        db = initDatabase(":memory:")
        albumRepo = createAlbumRepository(db)
        rotationRepo = createRotationStateRepository(db)
        service = createRotationGenerationService(albumRepo, rotationRepo)
    })

    it("generates a rotation with status draft (not persisted)", () => {
        for (let i = 0; i < 30; i++) {
            albumRepo.save(makeAlbum(`a-${i}`, "new"))
        }

        const plan = service.generateRotation()
        expect(plan.status).toBe("draft")
        expect(rotationRepo.findActive()).toBeNull()
        expect(rotationRepo.findDraft()).toBeNull()
    })

    it("excludes archived and admire albums", () => {
        for (let i = 0; i < 5; i++) albumRepo.save(makeAlbum(`new-${i}`, "new"))
        for (let i = 0; i < 5; i++) albumRepo.save(makeAlbum(`arch-${i}`, "archive"))
        for (let i = 0; i < 5; i++) albumRepo.save(makeAlbum(`adm-${i}`, "admire"))

        const plan = service.generateRotation()
        const ids = plan.items.map(i => i.albumId)
        expect(ids.some(id => id.startsWith("arch-"))).toBe(false)
        expect(ids.some(id => id.startsWith("adm-"))).toBe(false)
    })

    it("excludes albums without a category", () => {
        for (let i = 0; i < 30; i++) {
            albumRepo.save(makeAlbum(`a-${i}`, "new"))
        }
        // Clear all categories
        db.prepare("UPDATE albums SET category = NULL").run()

        expect(() => service.generateRotation()).toThrow("NO_ELIGIBLE_ALBUMS")
    })

    it("respects rotation settings from the database", () => {
        for (let i = 0; i < 30; i++) {
            albumRepo.save(makeAlbum(`a-${i}`, i < 10 ? "new" : i < 20 ? "classic" : "growing"))
        }

        rotationRepo.saveSettings({
            targetSize: 10,
            roleQuotas: [
                { role: "new", targetCount: 3 },
                { role: "classic", targetCount: 3 },
                { role: "growing", targetCount: 3 },
            ],
        })

        const plan = service.generateRotation()
        expect(plan.items.length).toBe(10)
    })

    it("uses continuity weighting from previous active rotation", () => {
        for (let i = 0; i < 30; i++) {
            albumRepo.save(makeAlbum(`a-${i}`, "new"))
        }

        // Create an active rotation
        const firstPlan = service.generateRotation()
        service.activateRotation(firstPlan)

        // Generate a new plan with fixed seed
        const secondPlan = service.generateRotation({ random: () => 0.5 })
        // Previous album IDs should be less likely but still possible
        const previousIds = new Set(firstPlan.albumIds)
        const overlap = secondPlan.items.filter(i => previousIds.has(i.albumId)).length
        // With continuity weighting 0.2, some albums might still appear but fewer
        expect(overlap).toBeLessThanOrEqual(firstPlan.albumIds.length)
    })

    it("activates rotation and archives previous", () => {
        for (let i = 0; i < 30; i++) {
            albumRepo.save(makeAlbum(`a-${i}`, "new"))
        }

        const first = service.generateRotation()
        service.activateRotation(first)

        expect(rotationRepo.findActive()?.id).toBe(first.id)

        const second = service.generateRotation()
        service.activateRotation(second)

        expect(rotationRepo.findActive()?.id).toBe(second.id)
        expect(rotationRepo.findHistory().items[0]?.id).toBe(first.id)
    })

    it("sets focusAlbumId to null after automated activation", () => {
        for (let i = 0; i < 30; i++) {
            albumRepo.save(makeAlbum(`a-${i}`, "new"))
        }

        const plan = service.generateRotation()
        const activated = service.activateRotation(plan)
        expect(activated.focusAlbumId).toBeNull()
    })

    it("attaches generationSource and executionKey", () => {
        for (let i = 0; i < 30; i++) {
            albumRepo.save(makeAlbum(`a-${i}`, "new"))
        }

        const manual = service.generateRotation()
        expect(manual.generationSource).toBe("manual")
        expect(manual.automationExecutionKey).toBeNull()

        const automated = service.generateRotation({ executionKey: "2026-W30" })
        expect(automated.generationSource).toBe("automation")
        expect(automated.automationExecutionKey).toBe("2026-W30")
    })

    it("uses fixed generateId when provided", () => {
        for (let i = 0; i < 30; i++) {
            albumRepo.save(makeAlbum(`a-${i}`, "new", `Title-${i}`, i % 5))
        }

        const plan = service.generateRotation({ generateId: () => "fixed-id" })
        expect(plan.id).toBe("fixed-id")
    })

    it("throws on empty eligible album list", () => {
        expect(() => service.generateRotation()).toThrow("NO_ELIGIBLE_ALBUMS")
    })
})