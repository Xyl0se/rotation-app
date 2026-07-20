import type Database from "better-sqlite3"
import type { Album } from "../domain/albumTypes.js"
import type { AlbumRepository } from "../infrastructure/persistence/sqlite/albumRepository.js"
import type { BindingRepository } from "../infrastructure/persistence/sqlite/bindingRepository.js"
import type { PlaybackManifestRepository } from "../infrastructure/persistence/sqlite/playbackManifestRepository.js"

export function createBindingCaptureService(
    db: Database.Database,
    albumRepo: AlbumRepository,
    bindingRepo: BindingRepository,
    manifestRepo?: PlaybackManifestRepository,
) {
    const capture = db.transaction((bindingId: string, album: Album) => {
        const binding = bindingRepo.findById(bindingId)
        if (!binding) throw new Error("BINDING_NOT_FOUND")

        const existingAlbum = albumRepo.findById(album.id)
        if (existingAlbum && (
            existingAlbum.title !== album.title || existingAlbum.artist !== album.artist
        )) {
            throw new Error("ALBUM_ID_CONFLICT")
        }
        if (binding.library_album_id && binding.library_album_id !== album.id) {
            throw new Error("BINDING_ALREADY_LINKED")
        }

        if (!existingAlbum) albumRepo.save(album)
        if (!bindingRepo.updateLibraryAlbumId(bindingId, album.id)) {
            throw new Error("BINDING_LINK_FAILED")
        }
        if (!bindingRepo.confirm(bindingId,"manual",new Date().toISOString())) {
            throw new Error("BINDING_CONFIRM_FAILED")
        }
        // Invalidate cached manifest when binding is confirmed or re-linked
        manifestRepo?.invalidateManifest(album.id)
        return {
            album: albumRepo.findById(album.id)!,
            binding: bindingRepo.findWithAlbumDataById(bindingId)!,
        }
    })

    return {
        capture(bindingId: string, album: Album): {
            album: Album
            binding: NonNullable<ReturnType<BindingRepository["findWithAlbumDataById"]>>
        } {
            return capture(bindingId, album)
        },
    }
}

export type BindingCaptureService = ReturnType<typeof createBindingCaptureService>
