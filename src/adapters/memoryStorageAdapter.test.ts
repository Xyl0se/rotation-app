import { describe, it, expect, beforeEach } from "vitest"
import { createMemoryStorageAdapter } from "./memoryStorageAdapter"

describe("createMemoryStorageAdapter", () => {
    let adapter = createMemoryStorageAdapter()

    beforeEach(() => {
        adapter = createMemoryStorageAdapter()
    })

    it("returns null for unknown keys", () => {
        expect(adapter.get("unknown")).toBeNull()
    })

    it("stores and retrieves values", () => {
        adapter.set("foo", "bar")
        expect(adapter.get("foo")).toBe("bar")
    })

    it("overwrites existing values", () => {
        adapter.set("foo", "bar")
        adapter.set("foo", "baz")
        expect(adapter.get("foo")).toBe("baz")
    })

    it("removes a key", () => {
        adapter.set("foo", "bar")
        adapter.remove("foo")
        expect(adapter.get("foo")).toBeNull()
    })

    it("clears all keys", () => {
        adapter.set("a", "1")
        adapter.set("b", "2")
        adapter.clear()
        expect(adapter.get("a")).toBeNull()
        expect(adapter.get("b")).toBeNull()
        expect(adapter.keys()).toEqual([])
    })

    it("lists all keys", () => {
        adapter.set("b", "2")
        adapter.set("a", "1")
        expect(adapter.keys()).toEqual(["b", "a"])
    })

    it("isolates instances from each other", () => {
        const other = createMemoryStorageAdapter()
        adapter.set("foo", "bar")
        expect(other.get("foo")).toBeNull()
    })
})
