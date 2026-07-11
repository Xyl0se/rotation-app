export type RoleId =
    | "new"
    | "growing"
    | "comfort-food"
    | "classic"
    | "admire"
    | "archive"

export interface RoleDefinition {
    id: RoleId
    icon: string
    title: string
    description: string
}

export const roles: RoleDefinition[] = [
    {
        id: "new",
        icon: "🌱",
        title: "Newly Discovered",
        description:
            "I want to get to know this album first.",
    },
    {
        id: "growing",
        icon: "🌿",
        title: "Still Growing",
        description:
            "I discover more with every listen.",
    },
    {
        id: "comfort-food",
        icon: "❤️",
        title: "Comfort Food",
        description:
            "I keep coming back to this one.",
    },
    {
        id: "classic",
        icon: "🏛",
        title: "Classic",
        description:
            "This album has shaped me over a longer period and remains part of my musical biography.",
    },
    {
        id: "admire",
        icon: "🎩",
        title: "Admiration",
        description:
            "I recognize its musical greatness, even if I don't instinctively reach for it anymore.",
    },
    {
        id: "archive",
        icon: "📦",
        title: "Archive",
        description:
            "This album may rest for now, without disappearing from my story.",
    },
]
