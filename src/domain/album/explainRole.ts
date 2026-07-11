import type { RoleId } from "../roles"

export function explainRole(role: RoleId): string {
    switch (role) {
        case "new":
            return "You don't know this album well enough yet. Give it some more time."
        case "growing":
            return "This album still surprises or challenges you."
        case "comfort-food":
            return "You reach for this album intuitively."
        case "classic":
            return "This album has shaped you over a longer period and remains part of your musical biography."
        case "admire":
            return "This album is highly valued musically, even if you don't instinctively reach for it anymore."
        case "archive":
            return "This album may rest for now, without disappearing from your story."
        default:
            return ""
    }
}
