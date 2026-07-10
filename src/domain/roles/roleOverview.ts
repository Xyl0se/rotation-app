import type { Album } from "../../types/album"

import type { RoleId, RoleDefinition } from "../roles"

import { roles } from "../roles"

export interface RoleOverview {

    role: RoleDefinition

    albumCount: number

    previewAlbums: Album[]

    isEmpty: boolean

}

export interface RoleStats {

    albumCount: number

    previewAlbums: Album[]

}

export function getAlbumsByRole(

    albums: Album[],

    roleId: RoleId,

): Album[] {

    return albums.filter(

        album => album.category === roleId,
    )

}

export function getRoleStats(

    albums: Album[],

    roleId: RoleId,

    maxPreviewCount = 3,

): RoleStats {

    const roleAlbums = getAlbumsByRole(albums, roleId)

    return {

        albumCount: roleAlbums.length,

        previewAlbums: roleAlbums.slice(0, maxPreviewCount),

    }

}

export function createRoleOverview(

    albums: Album[],

    maxPreviewCount = 3,

): RoleOverview[] {

    return roles.map(role => {

        const stats = getRoleStats(
            albums,
            role.id,
            maxPreviewCount,
        )

        return {

            role,

            albumCount: stats.albumCount,

            previewAlbums: stats.previewAlbums,

            isEmpty: stats.albumCount === 0,

        }

    })

}
