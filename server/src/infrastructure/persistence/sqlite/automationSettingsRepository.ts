import Database from "better-sqlite3"

export interface AutomationSettings {
    enabled: boolean
    weekday: number
    time: string
    timezone: string
    email_recipient: string | null
    email_enabled: boolean
    auto_export_enabled: boolean
    grace_period_minutes: number
    updated_at: string
}

export interface AutomationSettingsUpdate {
    enabled?: boolean
    weekday?: number
    time?: string
    timezone?: string
    email_recipient?: string | null
    email_enabled?: boolean
    auto_export_enabled?: boolean
    grace_period_minutes?: number
}

export function createAutomationSettingsRepository(db: Database.Database) {
    db.exec(`
        INSERT OR IGNORE INTO automation_settings (
            singleton, enabled, weekday, time, timezone,
            email_recipient, email_enabled, auto_export_enabled,
            grace_period_minutes, updated_at
        ) VALUES (
            1, 0, 0, '20:00', 'Europe/Berlin',
            NULL, 0, 0,
            240, CURRENT_TIMESTAMP
        );
    `)

    const find = db.prepare<[]>(`
        SELECT
            singleton,
            enabled,
            weekday,
            time,
            timezone,
            email_recipient,
            email_enabled,
            auto_export_enabled,
            grace_period_minutes,
            updated_at
        FROM automation_settings
        WHERE singleton = 1
    `)

    const update = db.prepare<[
        number, // enabled
        number, // weekday
        string, // time
        string, // timezone
        string | null, // email_recipient
        number, // email_enabled
        number, // auto_export_enabled
        number, // grace_period_minutes
        string, // updated_at
    ]>(`
        UPDATE automation_settings
        SET enabled = ?,
            weekday = ?,
            time = ?,
            timezone = ?,
            email_recipient = ?,
            email_enabled = ?,
            auto_export_enabled = ?,
            grace_period_minutes = ?,
            updated_at = ?
        WHERE singleton = 1
    `)

    function rowToSettings(row: Record<string, unknown>): AutomationSettings {
        return {
            enabled: (row.enabled as number) === 1,
            weekday: row.weekday as number,
            time: row.time as string,
            timezone: row.timezone as string,
            email_recipient: (row.email_recipient as string | null) ?? null,
            email_enabled: (row.email_enabled as number) === 1,
            auto_export_enabled: (row.auto_export_enabled as number) === 1,
            grace_period_minutes: row.grace_period_minutes as number,
            updated_at: row.updated_at as string,
        }
    }

    return {
        findSettings(): AutomationSettings {
            const row = find.get() as Record<string, unknown> | undefined
            if (!row) {
                throw new Error("automation_settings singleton row missing")
            }
            return rowToSettings(row)
        },

        saveSettings(changes: AutomationSettingsUpdate): AutomationSettings {
            const current = this.findSettings()

            const next: AutomationSettings = {
                enabled: changes.enabled ?? current.enabled,
                weekday: changes.weekday ?? current.weekday,
                time: changes.time ?? current.time,
                timezone: changes.timezone ?? current.timezone,
                email_recipient: changes.email_recipient !== undefined ? changes.email_recipient : current.email_recipient,
                email_enabled: changes.email_enabled ?? current.email_enabled,
                auto_export_enabled: changes.auto_export_enabled ?? current.auto_export_enabled,
                grace_period_minutes: changes.grace_period_minutes ?? current.grace_period_minutes,
                updated_at: new Date().toISOString(),
            }

            update.run(
                next.enabled ? 1 : 0,
                next.weekday,
                next.time,
                next.timezone,
                next.email_recipient,
                next.email_enabled ? 1 : 0,
                next.auto_export_enabled ? 1 : 0,
                next.grace_period_minutes,
                next.updated_at,
            )

            return next
        },
    }
}

export type AutomationSettingsRepository = ReturnType<typeof createAutomationSettingsRepository>