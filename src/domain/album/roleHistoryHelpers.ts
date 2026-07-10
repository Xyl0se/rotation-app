import type { Album } from "../../types/album"

import type {
    RoleHistoryEntry,
} from "./roleHistory"

/**
 * Liefert den neuesten
 * History-Eintrag.
 */
export function getCurrentRoleHistoryEntry(

    album: Album,

): RoleHistoryEntry | undefined {

    return album.roleHistory.at(-1)

}

/**
 * Liefert den ersten
 * History-Eintrag.
 */
export function getFirstRoleHistoryEntry(

    album: Album,

): RoleHistoryEntry | undefined {

    return album.roleHistory[0]

}

/**
 * Seit wann besitzt
 * das Album seine
 * aktuelle Rolle?
 */
export function getRoleSince(

    album: Album,

): string | undefined {

    return getCurrentRoleHistoryEntry(

        album,

    )?.recordedAt

}