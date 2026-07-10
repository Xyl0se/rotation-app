import type { RoleId } from "../roles"

export type ReflectionRuleCode =
    | "new-after-listens"
    | "growing-for-a-while"
    | "comfort-not-recent"
    | "archive-return-candidate"

export interface ReflectionRule {

    code: ReflectionRuleCode

    role: RoleId

    minimumListenCount?: number

    minimumDaysInRole?: number

    minimumDaysSinceListen?: number

}

export const reflectionRules: ReflectionRule[] = [

    {

        code: "new-after-listens",

        role: "new",

        minimumListenCount: 3,

    },

    {

        code: "growing-for-a-while",

        role: "growing",

        minimumDaysInRole: 90,

    },

    {

        code: "comfort-not-recent",

        role: "comfort-food",

        minimumDaysSinceListen: 60,

    },

    {

        code: "archive-return-candidate",

        role: "archive",

        minimumDaysInRole: 180,

    },

]
