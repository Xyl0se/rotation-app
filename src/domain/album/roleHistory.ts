import type { RoleId } from "../roles"

export interface RoleHistoryEntry {

    role: RoleId

    recordedAt: string

    /**
     * Where does this change come from?
     */
    source: "coach" | "reflection" | "archive"

}
