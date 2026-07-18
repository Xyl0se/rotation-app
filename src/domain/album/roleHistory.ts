import type { RoleId } from "../roles"

export type ArchiveReason =
    | "not-interested-in-discovery"
    | "relationship-complete"
    | "canonical-but-not-personal"
    | "no-connection"

export interface RoleHistoryEntry {

    role: RoleId

    recordedAt: string

    /**
     * Where does this change come from?
     */
    source: "coach" | "reflection" | "archive"

    /** Why an Album entered Archive. Absent on legacy entries and non-Archive roles. */
    archiveReason?: ArchiveReason

}
