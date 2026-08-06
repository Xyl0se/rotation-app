function getWeekdayInZone(date: Date, timezone: string): number {
    const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        weekday: "short",
    })
    const parts = formatter.formatToParts(date)
    const name = parts.find((p) => p.type === "weekday")?.value
    const map: Record<string, number> = {
        Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
    }
    return map[name!] ?? 0
}

function getHourInZone(date: Date, timezone: string): number {
    const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        hour: "numeric",
        hour12: false,
    })
    const parts = formatter.formatToParts(date)
    return parseInt(parts.find((p) => p.type === "hour")?.value ?? "0", 10)
}

function getMinuteInZone(date: Date, timezone: string): number {
    const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        minute: "numeric",
    })
    const parts = formatter.formatToParts(date)
    return parseInt(parts.find((p) => p.type === "minute")?.value ?? "0", 10)
}

function findTimeInZone(
    baseDate: Date,
    timezone: string,
    targetWeekday: number,
    targetHour: number,
    targetMinute: number,
    direction: "next" | "last",
): Date | null {
    const dayMs = 24 * 60 * 60 * 1000
    const limit = 8

    for (let dayOffset = 0; dayOffset <= limit; dayOffset++) {
        const sign = direction === "next" ? 1 : -1
        const candidateDay = new Date(baseDate.getTime() + dayOffset * sign * dayMs)
        const dayStart = new Date(candidateDay)
        dayStart.setHours(0, 0, 0, 0)

        const startMin = direction === "next" ? 0 : 24 * 60 - 1
        const endMin = direction === "next" ? 24 * 60 : -1
        const step = direction === "next" ? 1 : -1

        for (let minOfDay = startMin; minOfDay !== endMin; minOfDay += step) {
            const test = new Date(dayStart)
            test.setHours(Math.floor(minOfDay / 60), minOfDay % 60, 0, 0)

            if (
                getWeekdayInZone(test, timezone) === targetWeekday &&
                getHourInZone(test, timezone) === targetHour &&
                getMinuteInZone(test, timezone) === targetMinute
            ) {
                if (direction === "next" && test > baseDate) {
                    return test
                }
                if (direction === "last" && test < baseDate) {
                    return test
                }
            }
        }
    }

    return null
}

export function getNextRunAt(
    weekday: number,
    time: string,
    timezone: string,
    from: Date = new Date(),
): Date | null {
    const [hour, minute] = time.split(":").map(Number)
    return findTimeInZone(from, timezone, weekday, hour, minute, "next")
}

export function getLastRunAt(
    weekday: number,
    time: string,
    timezone: string,
    from: Date = new Date(),
): Date | null {
    const [hour, minute] = time.split(":").map(Number)
    return findTimeInZone(from, timezone, weekday, hour, minute, "last")
}

export function getCurrentISOWeek(forDate = new Date()): string {
    const d = new Date(forDate)
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() + 4 - (d.getDay() || 7))
    const yearStart = new Date(d.getFullYear(), 0, 1)
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
    return `${d.getFullYear()}-W${String(weekNo).padStart(2, "0")}`
}
