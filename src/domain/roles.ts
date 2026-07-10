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

        title: "Neu entdeckt",

        description:
            "Dieses Album möchte ich erst kennenlernen.",

    },

    {

        id: "growing",

        icon: "🌿",

        title: "Wächst noch",

        description:
            "Mit jedem Hören entdecke ich mehr.",

    },

    {

        id: "comfort-food",

        icon: "❤️",

        title: "Comfort Food",

        description:
            "Hierhin komme ich immer wieder zurück.",

    },

    {

        id: "classic",

        icon: "🏛",

        title: "Klassiker",

        description:
            "Dieses Album hat mich über längere Zeit geprägt und bleibt Teil meiner musikalischen Biografie.",

    },

    {

        id: "admire",

        icon: "🎩",

        title: "Bewunderung",

        description:
            "Ich erkenne seine musikalische Größe an, auch wenn ich nicht mehr selbstverständlich dazu greife.",

    },

    {

        id: "archive",

        icon: "📦",

        title: "Archiv",

        description:
            "Dieses Album darf im Moment ruhen, ohne aus meiner Geschichte zu verschwinden.",

    },

]