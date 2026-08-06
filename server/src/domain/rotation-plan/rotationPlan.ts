// Re-export from shared domain for incremental migration
export type {
    RotationCandidate,
    RotationEligibleRole,
    RotationPlan,
    RotationPlanItem,
    RotationPlanReason,
    RotationPlanStatus,
    RotationRoleQuota,
} from "@rotation/domain"

export {
    defaultRotationRoleQuotas,
    defaultRotationTargetSize,
} from "@rotation/domain"