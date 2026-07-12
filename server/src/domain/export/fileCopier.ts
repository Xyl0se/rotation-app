import { readdirSync, statSync, copyFileSync, mkdirSync, writeFileSync } from "node:fs"
import { join, dirname } from "node:path"
import type { PathGuard } from "../../infrastructure/filesystem/pathGuard.js"
import type { ExportManifest } from "./manifest.js"

export class FileCopyError extends Error {
    constructor(message: string, public readonly cause?: unknown) {
        super(message)
        this.name = "FileCopyError"
    }
}

export function calculateDirectorySize(dir: string): number {
    let total = 0
    const entries = readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
        const fullPath = join(dir, entry.name)
        if (entry.isDirectory()) {
            total += calculateDirectorySize(fullPath)
        } else if (entry.isFile()) {
            total += statSync(fullPath).size
        }
    }
    return total
}

export function countFiles(dir: string): number {
    let total = 0
    const entries = readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
        const fullPath = join(dir, entry.name)
        if (entry.isDirectory()) {
            total += countFiles(fullPath)
        } else if (entry.isFile()) {
            total++
        }
    }
    return total
}

export function copyDirectory(
    srcDir: string,
    destDir: string,
    onProgress?: (copied: number) => void,
): void {
    mkdirSync(destDir, { recursive: true })
    const entries = readdirSync(srcDir, { withFileTypes: true })
    let copied = 0

    for (const entry of entries) {
        const srcPath = join(srcDir, entry.name)
        const destPath = join(destDir, entry.name)

        if (entry.isDirectory()) {
            copyDirectory(srcPath, destPath, (subCopied) => {
                copied += subCopied
                onProgress?.(copied)
            })
        } else if (entry.isFile()) {
            mkdirSync(dirname(destPath), { recursive: true })
            copyFileSync(srcPath, destPath)
            copied++
        }
    }

    onProgress?.(copied)
}

export function writeManifest(manifestPath: string, manifest: ExportManifest): void {
    mkdirSync(dirname(manifestPath), { recursive: true })
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf-8")
}

export function resolveSourcePath(relativePath: string, musicGuard: PathGuard): string {
    return musicGuard(relativePath)
}

export function resolveStagingPath(exportId: string, workspaceGuard: PathGuard): string {
    return workspaceGuard(`staging-exports/${exportId}`)
}

export function resolveExportTargetDir(workspaceGuard: PathGuard): string {
    return workspaceGuard("exports/current-rotation")
}

export function resolveArchiveDir(timestamp: string, workspaceGuard: PathGuard): string {
    return workspaceGuard(`exports/archive/${timestamp}`)
}
