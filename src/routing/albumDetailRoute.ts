export function albumDetailPath(albumId: string) {
    return `/albums/${encodeURIComponent(albumId)}`
}

export function albumIdFromPath(pathname: string) {
    const match = pathname.match(/^\/albums\/([^/]+)\/?$/)
    if (!match) return null
    try {
        return decodeURIComponent(match[1])
    } catch {
        return null
    }
}
