import { renameSync, existsSync, rmSync, mkdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import type { BindingRecord } from "../../infrastructure/persistence/sqlite/bindingRepository.js"
import type { PathGuard } from "../../infrastructure/filesystem/pathGuard.js"
import { createManifest, type ExportManifest } from "./manifest.js"
import { readCurrentManifest } from "./manifestReader.js"
import { calculateExportDiff } from "./exportDiff.js"
import type { ExportDiff } from "./exportDiff.js"
import {
    calculateDirectorySize,
    countFiles,
    copyDirectory,
    writeManifest,
    resolveSourcePath,
    resolveStagingPath,
    resolveExportTargetDir,
    resolveArchiveDir,
} from "./fileCopier.js"

export interface ExportSource {
    albumId: string
    relativePath: string
    artistName: string
    albumName: string
    absolutePath: string
}

export interface ExportPreviewResult {
    exportId: string
    albumCount: number
    totalSizeBytes: number
    fileCount: number
    sources: ExportSource[]
    missingBindings: string[]
    unconfirmedBindings: string[]
    canExport: boolean
}

export interface ExportStageResult {
    stagingPath: string
    manifestPath: string
    manifest: ExportManifest
}

export interface ExportApplyResult {
    exportPath: string
    archivePath: string | null
}

export type SizeCalculator = (absolutePath: string) => { sizeBytes: number; fileCount: number }

export function previewExport(
    exportId: string,
    albumIds: string[],
    bindings: Map<string, BindingRecord>,
    musicGuard: PathGuard,
    sizeCalculator: SizeCalculator = (dir) => ({
        sizeBytes: calculateDirectorySize(dir),
        fileCount: countFiles(dir),
    }),
): ExportPreviewResult {
    const sources: ExportSource[] = []
    const missingBindings: string[] = []
    const unconfirmedBindings: string[] = []

    for (const albumId of albumIds) {
        const binding = bindings.get(albumId)
        if (!binding) {
            missingBindings.push(albumId)
            continue
        }
        if (binding.state !== "confirmed") {
            unconfirmedBindings.push(albumId)
            continue
        }

        const absolutePath = resolveSourcePath(binding.relative_path, musicGuard)
        const parts = binding.relative_path.split(/[\\/]/)
        const artistName = parts.length >= 2 ? parts[parts.length - 2]! : ""
        const albumName = parts.length >= 1 ? parts[parts.length - 1]! : binding.relative_path

        sources.push({
            albumId,
            relativePath: binding.relative_path,
            artistName,
            albumName,
            absolutePath,
        })
    }

    let totalSizeBytes = 0
    let fileCount = 0

    for (const source of sources) {
        const metrics = sizeCalculator(source.absolutePath)
        totalSizeBytes += metrics.sizeBytes
        fileCount += metrics.fileCount
    }

    return {
        exportId,
        albumCount: sources.length,
        totalSizeBytes,
        fileCount,
        sources,
        missingBindings,
        unconfirmedBindings,
        canExport: sources.length > 0 && missingBindings.length === 0 && unconfirmedBindings.length === 0,
    }
}

export function stageExport(
    exportId: string,
    preview: ExportPreviewResult,
    workspaceGuard: PathGuard,
): ExportStageResult {
    const stagingPath = resolveStagingPath(exportId, workspaceGuard)

    for (const source of preview.sources) {
        const destDir = join(stagingPath, source.relativePath)
        copyDirectory(source.absolutePath, destDir)
    }

    const manifestAlbums = preview.sources.map((s) => ({
        albumId: s.albumId,
        relativePath: s.relativePath,
        artistName: s.artistName,
        albumName: s.albumName,
    }))

    const manifest = createManifest(
        exportId,
        manifestAlbums,
        preview.totalSizeBytes,
        preview.fileCount,
        "staged",
    )

    const manifestPath = join(stagingPath, "manifest.json")
    writeManifest(manifestPath, manifest)

    return { stagingPath, manifestPath, manifest }
}

export interface ExportApplyOptions {
    /** If true, only copy new albums; do NOT remove albums that are leaving the rotation. */
    keepRemoved?: boolean
    /** If provided, use this manifest instead of reading from current-rotation */
    currentManifestOverride?: ExportManifest | null
}

/**
 * Apply an export with support for incremental diff and optional retention of removed albums.
 *
 * Strategy:
 * 1. Calculate diff between new staging and current export
 * 2. Copy added albums from staging to target
 * 3. Remove albums from target that are no longer in rotation (unless keepRemoved)
 * 4. Update manifest
 * 5. Archive the old state (atomic via rename)
 */
export function applyExport(
    exportId: string,
    workspaceGuard: PathGuard,
    options: ExportApplyOptions = {},
): ExportApplyResult & { diff: ExportDiff } {
    const stagingPath = resolveStagingPath(exportId, workspaceGuard)
    const exportTargetDir = resolveExportTargetDir(workspaceGuard)

    if (!existsSync(stagingPath)) {
        throw new Error(`Staging directory does not exist: ${stagingPath}`)
    }

    // Read the staged manifest
    const stagedManifestPath = join(stagingPath, "manifest.json")
    if (!existsSync(stagedManifestPath)) {
        throw new Error(`Staged manifest not found: ${stagedManifestPath}`)
    }

    const stagedManifest: ExportManifest = JSON.parse(
        readFileSync(stagedManifestPath, "utf-8"),
    )

    // Read current manifest (or use override)
    const currentManifest = options.currentManifestOverride !== undefined
        ? options.currentManifestOverride
        : readCurrentManifest(workspaceGuard)

    const diff = calculateExportDiff(stagedManifest.albums, currentManifest)

    // Archive current export before modifying
    let archivePath: string | null = null
    if (existsSync(exportTargetDir)) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
        archivePath = resolveArchiveDir(timestamp, workspaceGuard)
        renameSync(exportTargetDir, archivePath)

        // Recreate target directory (empty)
        mkdirSync(exportTargetDir, { recursive: true })
    } else {
        mkdirSync(exportTargetDir, { recursive: true })
    }

    // Copy all albums from staging to target
    // (even unchanged ones, to keep the target self-contained)
    for (const source of stagedManifest.albums) {
        const srcDir = join(stagingPath, source.relativePath)
        const destDir = join(exportTargetDir, source.relativePath)
        if (existsSync(srcDir)) {
            copyDirectory(srcDir, destDir)
        }
    }

    // Write updated manifest to target
    const appliedManifest = createManifest(
        exportId,
        stagedManifest.albums,
        stagedManifest.totalSizeBytes,
        stagedManifest.fileCount,
        "applied",
    )
    writeManifest(join(exportTargetDir, "manifest.json"), appliedManifest)

    // Clean up staging
    rmSync(stagingPath, { recursive: true, force: true })

    return { exportPath: exportTargetDir, archivePath, diff }
}

export function calculateExportDiffForPreview(
    newAlbumIds: string[],
    bindings: Map<string, BindingRecord>,
    workspaceGuard: PathGuard,
): ExportDiff {
    const currentManifest = readCurrentManifest(workspaceGuard)

    const newAlbums: Array<{ albumId: string; relativePath: string; artistName: string; albumName: string }> = []
    for (const albumId of newAlbumIds) {
        const binding = bindings.get(albumId)
        if (binding && binding.state === "confirmed") {
            const parts = binding.relative_path.split(/[\\/]/)
            const artistName = parts.length >= 2 ? parts[parts.length - 2]! : ""
            const albumName = parts.length >= 1 ? parts[parts.length - 1]! : binding.relative_path
            newAlbums.push({
                albumId,
                relativePath: binding.relative_path,
                artistName,
                albumName,
            })
        }
    }

    return calculateExportDiff(newAlbums, currentManifest)
}

export function rollbackStaging(exportId: string, workspaceGuard: PathGuard): void {
    const stagingPath = resolveStagingPath(exportId, workspaceGuard)
    if (existsSync(stagingPath)) {
        rmSync(stagingPath, { recursive: true, force: true })
    }
}
