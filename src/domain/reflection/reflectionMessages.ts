import type { ReflectionPrompt } from "./evaluateReflection"

export interface ReflectionMessage {
    title: string
    description: string
    actionLabel: string
}

export function getReflectionMessage(
    prompt: ReflectionPrompt,
): ReflectionMessage {
    switch (prompt.code) {
        case "new-after-listens":
            return {
                title: "Maybe this album isn't new anymore",
                description:
                    "You've listened to it several times by now. Perhaps it already has a clearer role in your rotation.",
                actionLabel: "Reassign",
            }

        case "growing-for-a-while":
            return {
                title: "Is this album still growing?",
                description:
                    "This album has been in the role 'Still Growing' for a while. A fresh look can show whether it still belongs there.",
                actionLabel: "Reassign",
            }

        case "comfort-not-recent":
            return {
                title: "Is this still comfort food?",
                description:
                    "This album used to be familiar, but hasn't been listened to in a while. Perhaps its role is different today.",
                actionLabel: "Reassign",
            }

        case "archive-return-candidate":
            return {
                title: "Candidate for rediscovery?",
                description:
                    "This album has been resting in the archive for a while. Perhaps it's worth cautiously checking whether it fits back into your rotation today.",
                actionLabel: "Check Rediscovery",
            }
    }
}
