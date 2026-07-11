import type { RoleId } from "../roles"

import type { Translation } from "../../i18n/locales/en"

export function getRoleEmptyMessage(roleId: RoleId, t: Translation): string {
    const key = roleId as keyof Translation["roleEmpty"]
    return (t.roleEmpty[key] as string | undefined) ?? t.roleEmpty.default
}
