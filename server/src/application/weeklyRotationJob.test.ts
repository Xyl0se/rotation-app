import { describe, expect, it, beforeEach } from "vitest"
import { initDatabase } from "../infrastructure/persistence/sqlite/connection.js"
import { createAlbumRepository } from "../infrastructure/persistence/sqlite/albumRepository.js"
import { createRotationStateRepository } from "../infrastructure/persistence/sqlite/rotationStateRepository.js"
import { createAutomationSettingsRepository } from "../infrastructure/persistence/sqlite/automationSettingsRepository.js"
import { createRotationGenerationService } from "./rotationGenerationService.js"
import { createWeeklyRotationJob } from "./weeklyRotationJob.js"

function makeAlbum(id: string, category: string) {
    return {
        id,
        title: "Title",
        artist: "Artist",
        year: "2024",
        category: category as import("../domain/albumTypes.js").RoleId,
        listenCount: 0,
        lastListened: null,
        roleHistory: [],
        createdAt: "2026-01-01",
        sources: [],
    }
}

describe("weekly rotation job", () => {
    let db: ReturnType<typeof initDatabase>
    let albumRepo: ReturnType<typeof createAlbumRepository>
    let rotationRepo: ReturnType<typeof createRotationStateRepository>
    let settingsRepo: ReturnType<typeof createAutomationSettingsRepository>
    let generationService: ReturnType<typeof createRotationGenerationService>
    let job: ReturnType<typeof createWeeklyRotationJob>

    const mockExportService = {
        async runHeadlessExport() {
            return { exportPath: "/test", archivePath: null, diff: { added: [], removed: [], unchanged: [], previousExportId: null, previousAlbumCount: 0, newAlbumCount: 0 } }
        },
    }

    beforeEach(() => {
        db = initDatabase(":memory:")
        albumRepo = createAlbumRepository(db)
        rotationRepo = createRotationStateRepository(db)
        settingsRepo = createAutomationSettingsRepository(db)
        generationService = createRotationGenerationService(albumRepo, rotationRepo)

        for (let i = 0; i < 30; i++) {
            albumRepo.save(makeAlbum(`a-${i}`, "new"))
        }
    })

    function createJob(autoExport = false) {
        settingsRepo.saveSettings({ auto_export_enabled: autoExport })
        return createWeeklyRotationJob(generationService, mockExportService, settingsRepo)
    }

    it("generates and activates rotation", async () => {
        job = createJob(false)
        await job.handler("2026-W30")

        const active = rotationRepo.findActive()
        expect(active).not.toBeNull()
        expect(active?.status).toBe("active")
        expect(active?.generationSource).toBe("automation")
        expect(active?.automationExecutionKey).toBe("2026-W30")
        expect(active?.focusAlbumId).toBeNull()
    })

    it("skips export when auto_export_enabled is false", async () => {
        job = createJob(false)
        await job.handler("2026-W30")

        expect(rotationRepo.findActive()).not.toBeNull()
    })

    it("runs export when auto_export_enabled is true", async () => {
        let exportCalled = false
        const exportService = {
            async runHeadlessExport() {
                exportCalled = true
                return { exportPath: "/test", archivePath: null, diff: { added: [], removed: [], unchanged: [], previousExportId: null, previousAlbumCount: 0, newAlbumCount: 0 } }
            },
        }

        settingsRepo.saveSettings({ auto_export_enabled: true })
        job = createWeeklyRotationJob(generationService, exportService, settingsRepo)
        await job.handler("2026-W30")

        expect(exportCalled).toBe(true)
        expect(rotationRepo.findActive()).not.toBeNull()
    })

    it("does not activate rotation if export fails", async () => {
        const exportService = {
            async runHeadlessExport() {
                throw new Error("EXPORT_NOT_READY")
            },
        }

        settingsRepo.saveSettings({ auto_export_enabled: true })
        job = createWeeklyRotationJob(generationService, exportService, settingsRepo)

        await expect(job.handler("2026-W30")).rejects.toThrow("EXPORT_NOT_READY")
        expect(rotationRepo.findActive()).toBeNull()
    })

    it("uses execution key for week identification", () => {
        job = createJob(false)
        const key = job.getExecutionKey(new Date("2026-07-20")) // Monday
        expect(key).toBe("2026-W30")
    })

    it("catch-up uses the same execution key as original run", () => {
        job = createJob(false)
        const key = job.getExecutionKey(new Date("2026-07-20")) // Monday
        expect(key).toBe("2026-W30")
        const key2 = job.getExecutionKey(new Date("2026-07-21")) // Tuesday same week
        expect(key2).toBe("2026-W30")
    })
})