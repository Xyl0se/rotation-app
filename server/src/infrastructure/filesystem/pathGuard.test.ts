import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { mkdtempSync, writeFileSync, mkdirSync, symlinkSync, rmSync, realpathSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import {
    resolveSafePath,
    createPathGuard,
    PathTraversalError,
    SymlinkNotAllowedError,
} from "./pathGuard.js"

describe("resolveSafePath", () => {
    let baseDir: string

    beforeEach(() => {
        baseDir = realpathSync(mkdtempSync(join(tmpdir(), "rotation-test-")))
        mkdirSync(join(baseDir, "sub"))
        writeFileSync(join(baseDir, "file.txt"), "hello")
    })

    afterEach(() => {
        rmSync(baseDir, { recursive: true, force: true })
    })

    it("resolves a valid relative path inside base", () => {
        const result = resolveSafePath(baseDir, "file.txt")
        expect(result).toBe(join(baseDir, "file.txt"))
    })

    it("resolves a nested path", () => {
        const result = resolveSafePath(baseDir, "sub/../file.txt")
        expect(result).toBe(join(baseDir, "file.txt"))
    })

    it("rejects path traversal", () => {
        expect(() => resolveSafePath(baseDir, "../secret.txt")).toThrow(
            PathTraversalError,
        )
    })

    it("rejects traversal hidden in middle of path", () => {
        expect(() => resolveSafePath(baseDir, "sub/../../secret.txt")).toThrow(
            PathTraversalError,
        )
    })

    it("rejects symlinks with default policy", () => {
        const linkTarget = join(tmpdir(), "rotation-symlink-target")
        writeFileSync(linkTarget, "target")
        const linkPath = join(baseDir, "symlink.txt")
        symlinkSync(linkTarget, linkPath)

        expect(() => resolveSafePath(baseDir, "symlink.txt")).toThrow(
            SymlinkNotAllowedError,
        )

        rmSync(linkTarget, { force: true })
    })

    it("allows internal symlinks when policy is allow", () => {
        const linkTarget = join(baseDir, "file.txt")
        const linkPath = join(baseDir, "symlink.txt")
        symlinkSync(linkTarget, linkPath)

        const result = resolveSafePath(baseDir, "symlink.txt", {
            symlinkPolicy: "allow",
        })
        expect(result).toBe(linkTarget)
    })

    it("rejects external symlinks even when policy is allow", () => {
        const linkTarget = join(tmpdir(), "rotation-symlink-target")
        writeFileSync(linkTarget, "target")
        const linkPath = join(baseDir, "symlink.txt")
        symlinkSync(linkTarget, linkPath)

        expect(() => resolveSafePath(baseDir, "symlink.txt", {
            symlinkPolicy: "allow",
        })).toThrow(PathTraversalError)

        rmSync(linkTarget, { force: true })
    })

    it("rejects absolute path that escapes base", () => {
        expect(() => resolveSafePath(baseDir, "/etc/passwd")).toThrow(
            PathTraversalError,
        )
    })
})

describe("createPathGuard", () => {
    it("returns a curried function", () => {
        const guard = createPathGuard("/tmp")
        expect(typeof guard).toBe("function")
    })
})
