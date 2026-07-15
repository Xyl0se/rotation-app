import { describe, expect, it, beforeEach } from "vitest"
import {
    getCachedCover,
    cacheCover,
    hasCachedCover,
    clearCoverCache,
    saveCustomCover,
    getCustomCover,
    removeCustomCover,
} from "./coverCache"

// In-memory database per test file
const memoryDb = new Map<string, Map<string, unknown>>()

function getStore(name: string): Map<string, unknown> {
    if (!memoryDb.has(name)) {
        memoryDb.set(name, new Map())
    }
    return memoryDb.get(name)!
}

// --- IndexedDB-Mock ---

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createRequest(result?: unknown): any {
    const req: Record<string, unknown> = { result }

    Object.defineProperty(req, "onsuccess", {
        get() {
            return this._onsuccess || null
        },
        set(handler: () => void) {
            this._onsuccess = handler
            queueMicrotask(() => {
                if (this._onsuccess) this._onsuccess()
            })
        },
    })

    Object.defineProperty(req, "onerror", {
        get() {
            return this._onerror || null
        },
        set(handler: () => void) {
            this._onerror = handler
        },
    })

    return req
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createObjectStore(name: string): any {
    const data = getStore(name)

    return {
        put(value: unknown) {
            const key = (value as Record<string, unknown>)["albumId"]
            data.set(String(key), value)
            return createRequest(key)
        },
        get(key: unknown) {
            return createRequest(data.get(String(key)))
        },
        delete(key: unknown) {
            data.delete(String(key))
            return createRequest(undefined)
        },
        clear() {
            data.clear()
            return createRequest(undefined)
        },
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createTransaction(): any {
    return {
        objectStore: (name: string) => createObjectStore(name),
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createDatabase(): any {
    const storeNames = new Set<string>()

    return {
        objectStoreNames: {
            contains: (name: string) => storeNames.has(name),
        },
        transaction: () => createTransaction(),
        createObjectStore: (name: string) => {
            storeNames.add(name)
            return createObjectStore(name)
        },
        close: () => {},
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createOpenDBRequest(version = 1): any {
    const db = createDatabase()
    const req: Record<string, unknown> = { result: db }

    Object.defineProperty(req, "onsuccess", {
        get() {
            return this._onsuccess || null
        },
        set(handler: () => void) {
            this._onsuccess = handler
            queueMicrotask(() => {
                if (this._onsuccess) this._onsuccess()
            })
        },
    })

    Object.defineProperty(req, "onupgradeneeded", {
        get() {
            return this._onupgradeneeded || null
        },
        set(handler: (event: { target: { result: unknown }; oldVersion: number; newVersion: number }) => void) {
            this._onupgradeneeded = handler
            queueMicrotask(() => {
                if (this._onupgradeneeded) {
                    this._onupgradeneeded({
                        target: { result: db },
                        oldVersion: 0,
                        newVersion: version,
                    })
                }
            })
        },
    })

    Object.defineProperty(req, "onerror", {
        get() {
            return this._onerror || null
        },
        set(handler: () => void) {
            this._onerror = handler
        },
    })

    return req
}

beforeEach(() => {
    memoryDb.clear()

    Object.defineProperty(globalThis, "indexedDB", {
        value: {
            open() {
                return createOpenDBRequest()
            },
        },
        writable: true,
        configurable: true,
    })
})

// --- Helper functions ---

function createFakeBlob(): Blob {
    return new Blob(["fake-image-data"], { type: "image/jpeg" })
}

function createFetchResponse(
    blob: Blob | null,
    { status = 200, statusText = "OK" }: { status?: number; statusText?: string } = {},
): Response {
    return {
        ok: status >= 200 && status < 300,
        status,
        statusText,
        headers: new Headers(blob ? { "content-type": blob.type } : undefined),
        blob: async () => blob ?? new Blob([]),
    } as Response
}

describe("coverCache", () => {
    describe("getCachedCover", () => {
        it("returns null when no cover is cached", async () => {
            const result = await getCachedCover("album-1")
            expect(result).toBeNull()
        })
    })

    describe("cacheCover", () => {
        it("fetches and caches a cover", async () => {
            const blob = createFakeBlob()

            globalThis.fetch = () => Promise.resolve(createFetchResponse(blob))

            const blobUrl = await cacheCover(
                "album-1",
                "https://example.com/cover.jpg",
            )

            expect(blobUrl).toMatch(/^blob:/)

            const cached = await getCachedCover("album-1")
            expect(cached).not.toBeNull()
            expect(cached?.sourceUrl).toBe("https://example.com/cover.jpg")
            expect(cached?.blobUrl).toMatch(/^blob:/)
        })

        it("throws on failed download", async () => {
            globalThis.fetch = () => Promise.resolve(createFetchResponse(null, {
                status: 404,
                statusText: "Not Found",
            }))

            await expect(
                cacheCover("album-2", "https://example.com/missing.jpg"),
            ).rejects.toThrow("Cover download failed: 404 Not Found")
        })
    })

    describe("hasCachedCover", () => {
        it("returns false when no cover is cached", async () => {
            const result = await hasCachedCover("album-3")
            expect(result).toBe(false)
        })

        it("returns true when cover is cached", async () => {
            const blob = createFakeBlob()

            globalThis.fetch = () => Promise.resolve(createFetchResponse(blob))

            await cacheCover("album-4", "https://example.com/cover.jpg")

            const result = await hasCachedCover("album-4")
            expect(result).toBe(true)
        })
    })

    describe("clearCoverCache", () => {
        it("clears a single album cover", async () => {
            const blob = createFakeBlob()

            globalThis.fetch = () => Promise.resolve(createFetchResponse(blob))

            await cacheCover("album-a", "https://example.com/a.jpg")
            await cacheCover("album-b", "https://example.com/b.jpg")

            await clearCoverCache("album-a")

            expect(await hasCachedCover("album-a")).toBe(false)
            expect(await hasCachedCover("album-b")).toBe(true)
        })

        it("clears all covers when no albumId is given", async () => {
            const blob = createFakeBlob()

            globalThis.fetch = () => Promise.resolve(createFetchResponse(blob))

            await cacheCover("album-x", "https://example.com/x.jpg")
            await cacheCover("album-y", "https://example.com/y.jpg")

            await clearCoverCache()

            expect(await hasCachedCover("album-x")).toBe(false)
            expect(await hasCachedCover("album-y")).toBe(false)
        })
    })

    describe("saveCustomCover", () => {
        it("rejects empty blobs", async () => {
            await expect(
                saveCustomCover("album-1", new Blob([])),
            ).rejects.toThrow("Custom cover blob is empty")
        })

        it("saves a custom cover blob", async () => {
            const blob = createFakeBlob()
            await saveCustomCover("album-1", blob, { source: "upload" })

            const result = await getCustomCover("album-1")
            expect(result).not.toBeNull()
            expect(result?.blobUrl).toMatch(/^blob:/)
            expect(result?.source).toBe("upload")
        })
    })

    describe("getCustomCover", () => {
        it("returns null when no custom cover exists", async () => {
            const result = await getCustomCover("album-2")
            expect(result).toBeNull()
        })

        it("returns a blob URL for existing custom cover", async () => {
            const blob = createFakeBlob()
            await saveCustomCover("album-3", blob)

            const result = await getCustomCover("album-3")
            expect(result).not.toBeNull()
            expect(result?.blobUrl).toMatch(/^blob:/)
        })
    })

    describe("removeCustomCover", () => {
        it("deletes a saved custom cover", async () => {
            const blob = createFakeBlob()
            await saveCustomCover("album-4", blob)

            expect(await getCustomCover("album-4")).not.toBeNull()

            await removeCustomCover("album-4")

            expect(await getCustomCover("album-4")).toBeNull()
        })
    })
})
