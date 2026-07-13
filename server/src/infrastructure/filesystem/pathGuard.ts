import { realpathSync, lstatSync } from "node:fs"
import { resolve, sep } from "node:path"

export class PathTraversalError extends Error {
    constructor(message: string) {
        super(message)
        this.name = "PathTraversalError"
    }
}

export class SymlinkNotAllowedError extends Error {
    constructor(message: string) {
        super(message)
        this.name = "SymlinkNotAllowedError"
    }
}

export type SymlinkPolicy = "reject" | "allow"

export interface PathGuardOptions {
    symlinkPolicy: SymlinkPolicy
}

const DEFAULT_OPTIONS: PathGuardOptions = {
    symlinkPolicy: "reject",
}

function checkSymlink(resolvedPath: string): void {
    try {
        const stat = lstatSync(resolvedPath)
        if (stat.isSymbolicLink()) {
            throw new SymlinkNotAllowedError(
                `Symlinks are not allowed: ${resolvedPath}`,
            )
        }
    } catch (e) {
        if (e instanceof SymlinkNotAllowedError) throw e
        // File does not exist — check parent directories on next iteration
    }
}

export function resolveSafePath(
    allowedBase: string,
    relativePath: string,
    options: PathGuardOptions = DEFAULT_OPTIONS,
): string {
    // Normalize Unicode to NFC to prevent NFC/NFD canonical equivalence attacks
    const normalizedPath = relativePath.normalize("NFC")
    const resolved = resolve(allowedBase, normalizedPath)
    const realBase = realpathSync(allowedBase).normalize("NFC")

    if (options.symlinkPolicy === "reject") {
        // Walk path components from resolved down to base, reject symlinks
        let current = resolved
        while (current.length >= realBase.length) {
            checkSymlink(current)
            const parent = resolve(current, "..")
            if (parent === current) break
            current = parent
        }
    }

    let realResolved: string
    try {
        realResolved = realpathSync(resolved).normalize("NFC")
    } catch {
        // Target does not exist — fallback to resolved path
        // but we must still verify it stays within base
        realResolved = resolved.normalize("NFC")
    }

    // Ensure realResolved is strictly inside realBase
    const baseWithSep = realBase.endsWith(sep) ? realBase : realBase + sep
    if (
        realResolved !== realBase &&
        !realResolved.startsWith(baseWithSep)
    ) {
        throw new PathTraversalError(
            `Path "${relativePath}" resolves outside of allowed base`,
        )
    }

    return realResolved
}

export type PathGuard = (relativePath: string) => string

export function createPathGuard(
    allowedBase: string,
    options?: PathGuardOptions,
): PathGuard {
    return (relativePath: string): string =>
        resolveSafePath(allowedBase, relativePath, options)
}
