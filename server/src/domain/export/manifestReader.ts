import { readFileSync, existsSync } from "node:fs"
import { join } from "node:path"
import type { PathGuard } from "../../infrastructure/filesystem/pathGuard.js"
import type { ExportManifest } from "./manifest.js"

export function readCurrentManifest(workspaceGuard: PathGuard): ExportManifest | null {
    const manifestPath = join(workspaceGuard("exports/current-rotation"), "manifest.json")
    if (!existsSync(manifestPath)) {
        return null
    }
    try {
        const content = readFileSync(manifestPath, "utf-8")
        return JSON.parse(content) as ExportManifest
    } catch {
        return null
    }
}
