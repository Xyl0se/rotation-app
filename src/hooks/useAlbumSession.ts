import { useContext, useMemo } from "react"
import { AlbumSessionContext } from "../contexts/albumSessionState.js"
import { getCurrentTrack, getAlbumProgress } from "../domain/album-session/albumSessionState.js"

export function useAlbumSession() {
    const value = useContext(AlbumSessionContext)

    if (!value) {
        throw new Error("useAlbumSession must be used within an AlbumSessionProvider")
    }

    const { state, actions } = value

    const currentTrack = useMemo(() => getCurrentTrack(state), [state])

    const albumProgress = useMemo(() => getAlbumProgress(state), [state])

    return {
        state,
        currentTrack,
        albumProgress,
        ...actions,
    }
}