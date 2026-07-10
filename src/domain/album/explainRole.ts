import type { RoleId } from "../roles"

export function explainRole(
    role: RoleId
): string {

    switch (role) {

        case "new":
            return "Du kennst dieses Album noch nicht gut genug. Gib ihm noch etwas Zeit."

        case "growing":
            return "Dieses Album überrascht oder fordert dich noch immer."

        case "comfort-food":
            return "Zu diesem Album greifst du intuitiv zurück."

        case "classic":
            return "Dieses Album hat dich über längere Zeit geprägt und bleibt Teil deiner musikalischen Biografie."

        case "admire":
            return "Dieses Album wird musikalisch hoch geschätzt, auch wenn du nicht mehr selbstverständlich dazu greifst."

        case "archive":
            return "Dieses Album darf im Moment ruhen, ohne aus deiner Geschichte zu verschwinden."

        default:
            return ""
    }

}