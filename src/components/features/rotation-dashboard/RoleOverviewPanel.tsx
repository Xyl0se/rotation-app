import { roles } from "../../../domain/roles"
import { useI18n } from "../../../i18n/useI18n"
import type { ServerRoleOverview } from "../../../services/api/insightsService"

export default function RoleOverviewPanel({counts}:{counts:ServerRoleOverview}) {
    const {t}=useI18n()
    return <section className="role-overview-panel"><div className="rotation-overview">{roles.map(role=><article key={role.id} className="rotation-overview-card"><h3>{role.icon} {t.roles[role.id].title}</h3><p>{counts[role.id]} {counts[role.id]===1?t.common.album:t.common.albums}</p></article>)}</div></section>
}
