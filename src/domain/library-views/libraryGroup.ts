import type { Album } from "../../types/album"

/**
 * Gemeinsames Modell für gruppierte Bibliotheksansichten.
 *
 * Alle Gruppierungsfunktionen liefern dieselbe Struktur,
 * sodass die UI eine einzige Komponente für alle Perspektiven
 * verwenden kann.
 */
export interface LibraryGroup {
    /** Technischer Schlüssel für die Gruppe */
    key: string
    /** Anzeigetitel der Gruppe */
    title: string
    /** Optional: kurze Beschreibung oder Kontext */
    description?: string
    /** Alben in dieser Gruppe */
    albums: Album[]
}
