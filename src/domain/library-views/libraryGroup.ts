import type { Album } from "../../types/album"

/**
 * Common model for grouped library views.
 *
 * All grouping functions return the same structure,
 * so the UI can use a single component for all perspectives.
 */
export interface LibraryGroup {
    /** Technical key for the group */
    key: string
    /** Display title of the group */
    title: string
    /** Optional: short description or context */
    description?: string
    /** Albums in this group */
    albums: Album[]
}
