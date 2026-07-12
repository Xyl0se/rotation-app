export interface AlbumFolder {
    /** Relative path from music root: Artist/Album */
    relativePath: string
    /** Last directory name (the album name) */
    albumName: string
    /** Parent directory name (the artist name) */
    artistName: string
    /** Full resolved path on disk */
    absolutePath: string
}

export interface ScanOptions {
    /** Maximum depth to scan (default: 3) */
    maxDepth?: number
    /** Ignore patterns (exact names) */
    ignoreNames?: Set<string>
}

const DEFAULT_IGNORE = new Set([
    ".DS_Store",
    "Thumbs.db",
    ".@__thumb",
    "@eaDir",
    "#recycle",
    ".git",
    ".svn",
])

export function createDefaultScanOptions(): ScanOptions {
    return {
        maxDepth: 3,
        ignoreNames: DEFAULT_IGNORE,
    }
}
