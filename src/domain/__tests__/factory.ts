import type { Album } from "../../types/album"

export function makeAlbum(
    partial: Partial<Album> = {},
): Album {

    return {

        id: "test-album-1",

        title: "Test Album",

        artist: "Test Artist",

        year: "2024",

        coverUrl: undefined,

        category: "new",

        roleHistory: [],

        listenCount: 0,

        lastListened: null,

        ...partial,

    }

}
