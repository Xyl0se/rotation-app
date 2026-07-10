import type { RoleId } from "../roles"

export type RoleHistorySource =
    | "coach"
    | "reflection"
    | "archive"

export interface RoleHistoryEntry {

    /**
     * Die Rolle,
     * die dem Album zugewiesen wurde.
     */
    role: RoleId

    /**
     * Zeitpunkt der Einordnung
     * im ISO-Format.
     */
    recordedAt: string

    /**
     * Woher stammt diese Änderung?
     */
    source: RoleHistorySource

}
