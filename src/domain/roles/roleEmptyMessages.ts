import type { RoleId } from "../roles"

export function getRoleEmptyMessage(roleId: RoleId): string {

    switch (roleId) {

        case "new":
            return "Noch wartet kein Album darauf, entdeckt zu werden."

        case "growing":
            return "Hier wächst noch nichts — aber jede Sammlung fängt klein an."

        case "comfort-food":
            return "Noch gibt es keinen Ort, an den du immer wieder zurückkehrst."

        case "classic":
            return "Noch begleitet dich kein Album als Klassiker."

        case "admire":
            return "Noch staunst du vor keinem Album in Bewunderung."

        case "archive":
            return "Das Archiv ist noch leer — manche Alben brauchen erst Zeit."

        default:
            return "Diese Rolle wartet noch auf ihr erstes Album."

    }

}
