/**
 * Time categories for time-based groupings.
 *
 * Short, neutral keys — the UI translates them into English labels.
 */
export type RecencyCategory =
    | "today"
    | "thisWeek"
    | "thisMonth"
    | "thisYear"
    | "older"
    | "never"

/**
 * Label map for the UI.
 *
 * Centralized so all time-based views use
 * consistent group names.
 */
export const recencyGroups = [
    { key: "today", title: "Today" },
    { key: "thisWeek", title: "This Week" },
    { key: "thisMonth", title: "This Month" },
    { key: "thisYear", title: "This Year" },
    { key: "older", title: "Longer Ago" },
    { key: "never", title: "Not Yet Listened" },
] as const

/**
 * Maps an ISO date to a time category.
 *
 * @param isoDate ISO date or null
 * @param now Reference point (for tests)
 * @returns RecencyCategory
 */
export function categorizeRecency(
    isoDate: string | null,
    now = new Date(),
): RecencyCategory {
    if (!isoDate) return "never"

    const date = new Date(isoDate)
    const diffMs = now.getTime() - date.getTime()
    const diffHours = diffMs / (1000 * 60 * 60)
    const diffDays = diffHours / 24

    if (diffHours <= 24) return "today"
    if (diffDays <= 7) return "thisWeek"
    if (diffDays <= 30) return "thisMonth"
    if (diffDays <= 365) return "thisYear"

    return "older"
}
