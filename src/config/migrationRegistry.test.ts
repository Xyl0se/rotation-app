import { describe, it, expect, beforeEach } from "vitest"
import { createMemoryStorageAdapter } from "../adapters/memoryStorageAdapter"
import {
    registerMigration,
    getMigrations,
    clearMigrations,
    runRegisteredMigrations,
} from "./migrationRegistry"

describe("registerMigration", () => {
    beforeEach(() => {
        clearMigrations()
    })

    it("registers a migration", () => {
        registerMigration({
            version: "1",
            name: "test",
            run: () => {},
        })
        expect(getMigrations()).toHaveLength(1)
        expect(getMigrations()[0]).toMatchObject({ version: "1", name: "test" })
    })

    it("ignores exact duplicates (idempotent)", () => {
        const migration = {
            version: "1",
            name: "test",
            run: () => {},
        }
        registerMigration(migration)
        registerMigration(migration)
        expect(getMigrations()).toHaveLength(1)
    })

    it("throws on same version with different name", () => {
        registerMigration({
            version: "1",
            name: "first",
            run: () => {},
        })
        expect(() =>
            registerMigration({
                version: "1",
                name: "second",
                run: () => {},
            }),
        ).toThrow('already registered with name "first"')
    })

    it("rejects invalid version 'v1'", () => {
        expect(() =>
            registerMigration({
                version: "v1",
                name: "test",
                run: () => {},
            }),
        ).toThrow('Invalid migration version')
    })

    it("rejects invalid version '1.1'", () => {
        expect(() =>
            registerMigration({
                version: "1.1",
                name: "test",
                run: () => {},
            }),
        ).toThrow('Invalid migration version')
    })

    it("rejects invalid version '0'", () => {
        expect(() =>
            registerMigration({
                version: "0",
                name: "test",
                run: () => {},
            }),
        ).toThrow('Invalid migration version')
    })

    it("rejects invalid version 'latest'", () => {
        expect(() =>
            registerMigration({
                version: "latest",
                name: "test",
                run: () => {},
            }),
        ).toThrow('Invalid migration version')
    })

    it("sorts numerically (2 before 10)", () => {
        registerMigration({ version: "10", name: "ten", run: () => {} })
        registerMigration({ version: "1", name: "one", run: () => {} })
        registerMigration({ version: "2", name: "two", run: () => {} })

        const versions = getMigrations().map(m => m.version)
        expect(versions).toEqual(["1", "2", "10"])
    })
})

describe("runRegisteredMigrations", () => {
    beforeEach(() => {
        clearMigrations()
    })

    it("runs all migrations when fromVersion is '0'", () => {
        const adapter = createMemoryStorageAdapter()
        const runs: string[] = []

        registerMigration({
            version: "1",
            name: "first",
            run: () => { runs.push("1") },
        })
        registerMigration({
            version: "2",
            name: "second",
            run: () => { runs.push("2") },
        })

        runRegisteredMigrations(adapter, "0")
        expect(runs).toEqual(["1", "2"])
    })

    it("skips already applied migrations", () => {
        const adapter = createMemoryStorageAdapter()
        const runs: string[] = []

        registerMigration({
            version: "1",
            name: "first",
            run: () => { runs.push("1") },
        })
        registerMigration({
            version: "2",
            name: "second",
            run: () => { runs.push("2") },
        })

        runRegisteredMigrations(adapter, "1")
        expect(runs).toEqual(["2"])
    })

    it("runs migrations in version order", () => {
        const adapter = createMemoryStorageAdapter()
        const runs: string[] = []

        registerMigration({
            version: "3",
            name: "third",
            run: () => { runs.push("3") },
        })
        registerMigration({
            version: "1",
            name: "first",
            run: () => { runs.push("1") },
        })
        registerMigration({
            version: "2",
            name: "second",
            run: () => { runs.push("2") },
        })

        runRegisteredMigrations(adapter, "0")
        expect(runs).toEqual(["1", "2", "3"])
    })

    it("does nothing when no migrations are registered", () => {
        const adapter = createMemoryStorageAdapter()
        expect(() => runRegisteredMigrations(adapter, "0")).not.toThrow()
    })

    it("does nothing when fromVersion matches latest", () => {
        const adapter = createMemoryStorageAdapter()
        const runs: string[] = []

        registerMigration({
            version: "1",
            name: "first",
            run: () => { runs.push("1") },
        })

        runRegisteredMigrations(adapter, "1")
        expect(runs).toEqual([])
    })

    it("stops subsequent migrations when one throws", () => {
        const adapter = createMemoryStorageAdapter()
        const runs: string[] = []

        registerMigration({
            version: "1",
            name: "first",
            run: () => { runs.push("1") },
        })
        registerMigration({
            version: "2",
            name: "failing",
            run: () => { throw new Error("boom") },
        })
        registerMigration({
            version: "3",
            name: "third",
            run: () => { runs.push("3") },
        })

        expect(() => runRegisteredMigrations(adapter, "0")).toThrow("boom")
        expect(runs).toEqual(["1"])
    })
})
