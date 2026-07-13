import { describe, it, expect, beforeAll } from "vitest"
import { mkdtempSync, writeFileSync, symlinkSync, mkdirSync, realpathSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import {
    resolveSafePath,
    createPathGuard,
    PathTraversalError,
    SymlinkNotAllowedError,
} from "./pathGuard.js"

describe("resolveSafePath", () => {
    let base: string

    beforeAll(() => {
        base = mkdtempSync(join(tmpdir(), "pathguard-"))
        mkdirSync(join(base, "subdir"), { recursive: true })
        writeFileSync(join(base, "subdir", "file.txt"), "hello")
    })

    it("resolves a simple relative path", () => {
        const result = resolveSafePath(base, "subdir/file.txt")
        expect(result).toBe(join(realpathSync(base), "subdir", "file.txt"))
    })

    it("resolves empty relative path to base", () => {
        const result = resolveSafePath(base, "")
        expect(result).toBe(realpathSync(base))
    })

    it("rejects path traversal with ../", () => {
        expect(() => resolveSafePath(base, "../secret.txt")).toThrow(PathTraversalError)
    })

    it("rejects path traversal embedded in path", () => {
        expect(() => resolveSafePath(base, "subdir/../../../secret.txt")).toThrow(PathTraversalError)
    })

    it("allows symlinks when policy is allow", () => {
        const linkPath = join(base, "mylink2")
        try {
            symlinkSync(join(base, "subdir"), linkPath)
        } catch {
            // skip if symlinks not supported
            return
        }
        const result = resolveSafePath(base, "mylink2/file.txt", { symlinkPolicy: "allow" })
        expect(result).toBe(realpathSync(join(linkPath, "file.txt")))
    })

    it("rejects absolute paths that escape base", () => {
        expect(() => resolveSafePath(base, "/etc/passwd")).toThrow(PathTraversalError)
    })

    it("rejects paths containing null bytes", () => {
        expect(() => resolveSafePath(base, "foo\x00bar.txt")).toThrow(PathTraversalError)
    })

    it("rejects paths with embedded . and .. that escape base", () => {
        expect(() => resolveSafePath(base, "./../../secret.txt")).toThrow(PathTraversalError)
    })

    it("allows harmless . in path", () => {
        const result = resolveSafePath(base, "./subdir/file.txt")
        expect(result).toBe(join(realpathSync(base), "subdir", "file.txt"))
    })

    it("handles unicode normalization consistently (NFC vs NFD)", () => {
        const nfc = "T\u00e4st"
        const nfd = "Ta\u0308st"
        mkdirSync(join(base, nfc), { recursive: true })
        writeFileSync(join(base, nfc, "file.txt"), "hello")

        const resultNfc = resolveSafePath(base, `${nfc}/file.txt`)
        const resultNfd = resolveSafePath(base, `${nfd}/file.txt`)
        expect(resultNfc).toBe(resultNfd)
    })

    it("allows absolute paths that stay inside base", () => {
        const absoluteInside = join(base, "subdir", "file.txt")
        const result = resolveSafePath(base, absoluteInside)
        expect(result).toBe(join(realpathSync(base), "subdir", "file.txt"))
    })

    it("rejects symlinks even when created during resolution", () => {
        const linkPath = join(base, "racylink")
        try {
            symlinkSync(join(base, "subdir"), linkPath)
        } catch {
            return // skip if symlinks not supported
        }
        expect(() => resolveSafePath(base, "racylink/file.txt")).toThrow(SymlinkNotAllowedError)
    })
})

describe("createPathGuard", () => {
    it("returns a function that delegates to resolveSafePath", () => {
        const base = realpathSync(mkdtempSync(join(tmpdir(), "pathguard2-")))
        const guard = createPathGuard(base)
        expect(guard("foo")).toBe(join(base, "foo"))
    })
})
