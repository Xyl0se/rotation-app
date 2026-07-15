import { afterEach, describe, expect, it } from "vitest"
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { prepareRuntimeDirectories } from "./runtimeDirectories.js"

const roots: string[] = []

afterEach(() => {
    for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true })
})

describe("prepareRuntimeDirectories", () => {
    it("creates every writable runtime directory for a clean installation", () => {
        const root = mkdtempSync(join(tmpdir(), "rotation-runtime-"))
        roots.push(root)
        const dataDir = join(root, "data")
        const workspacePath = join(root, "workspace")
        const syncthingRoot = join(workspacePath, "exports", "current-rotation")

        prepareRuntimeDirectories({ dataDir, workspacePath, syncthingRoot })

        for (const path of [
            dataDir,
            join(dataDir, "backups"),
            join(dataDir, "covers"),
            join(workspacePath, "staging-exports"),
            join(workspacePath, "exports", "archive"),
            syncthingRoot,
        ]) expect(existsSync(path)).toBe(true)
    })

    it("fails with an actionable error when a configured directory is a file", () => {
        const root = mkdtempSync(join(tmpdir(), "rotation-runtime-"))
        roots.push(root)
        const invalid = join(root, "not-a-directory")
        writeFileSync(invalid, "x")

        expect(() => prepareRuntimeDirectories({
            dataDir: invalid,
            workspacePath: join(root, "workspace"),
            syncthingRoot: join(root, "workspace", "exports", "current-rotation"),
        })).toThrow(/1026:100/)
    })
})
