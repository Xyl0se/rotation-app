// Re-exports from shared domain for incremental migration.
// New code should import directly from '@rotation/domain'.

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

export {
    type GenerateRotationPlanDeps,
    type GenerateRotationPlanOptions,
    generateRotationPlan,
} from "@rotation/domain"

export {
    findReplacementCandidates,
} from "@rotation/domain"