import { describe, expect, it } from "vitest"
import { initDatabase } from "./connection.js"
import { createAutomationSettingsRepository } from "./automationSettingsRepository.js"

describe("automation settings repository", () => {
    it("creates default row on first access", () => {
        const db = initDatabase(":memory:")
        const repo = createAutomationSettingsRepository(db)

        const settings = repo.findSettings()
        expect(settings.enabled).toBe(false)
        expect(settings.weekday).toBe(0)
        expect(settings.time).toBe("20:00")
        expect(settings.timezone).toBe("Europe/Berlin")
        expect(settings.email_recipient).toBeNull()
        expect(settings.email_enabled).toBe(false)
        expect(settings.auto_export_enabled).toBe(false)
        expect(settings.grace_period_minutes).toBe(240)
        expect(settings.updated_at).toBeTruthy()
        db.close()
    })

    it("updates fields partially while preserving others", () => {
        const db = initDatabase(":memory:")
        const repo = createAutomationSettingsRepository(db)

        repo.saveSettings({ email_recipient: "user@example.com" })
        const first = repo.findSettings()
        expect(first.email_recipient).toBe("user@example.com")
        expect(first.enabled).toBe(false)

        const updated = repo.saveSettings({ enabled: true, weekday: 1, time: "08:30" })
        expect(updated.enabled).toBe(true)
        expect(updated.weekday).toBe(1)
        expect(updated.time).toBe("08:30")
        expect(updated.email_recipient).toBe("user@example.com")
        expect(updated.grace_period_minutes).toBe(240)

        const persisted = repo.findSettings()
        expect(persisted.enabled).toBe(true)
        expect(persisted.updated_at).toBe(updated.updated_at)
        db.close()
    })

    it("allows setting null for email_recipient", () => {
        const db = initDatabase(":memory:")
        const repo = createAutomationSettingsRepository(db)

        repo.saveSettings({ email_recipient: "a@b.com" })
        repo.saveSettings({ email_recipient: null })
        const settings = repo.findSettings()
        expect(settings.email_recipient).toBeNull()
        db.close()
    })
})