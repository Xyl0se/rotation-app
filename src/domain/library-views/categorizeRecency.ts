/**
 * Zeitkategorien für zeitbasierte Gruppierungen.
 *
 * Kürzere, neutrale Schlüssel — die UI übersetzt sie in deutsche Labels.
 */
export type RecencyCategory =
    | "today"
    | "thisWeek"
    | "thisMonth"
    | "thisYear"
    | "older"
    | "never"

/**
 * Label-Map für die UI.
 *
 * Zentralisiert, damit alle zeitbasierten Ansichten
 * konsistente Gruppennamen verwenden.
 */
export const recencyGroups = [
    { key: "today", title: "Heute" },
    { key: "thisWeek", title: "Diese Woche" },
    { key: "thisMonth", title: "Dieser Monat" },
    { key: "thisYear", title: "Dieses Jahr" },
    { key: "older", title: "Länger her" },
    { key: "never", title: "Noch nicht gehört" },
] as const

/**
 * Ordnet ein ISO-Datum einer Zeitkategorie zu.
 *
 * @param isoDate ISO-Datum oder null
 * @param now Referenzzeitpunkt (für Tests)
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
