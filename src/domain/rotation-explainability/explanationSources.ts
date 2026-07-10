export type RotationExplanationSource =
    | "role"
    | "listen-history"
    | "role-history"
    | "plan-reason"
    | "story"

export interface RotationExplanation {
    text: string

    source: RotationExplanationSource
}
