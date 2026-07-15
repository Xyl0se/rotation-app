import type { StorageAdapter } from "../adapters/storageAdapter"
import type { Album } from "../types/album"
import { STORAGE } from "../config/storage"
import { generateUUID } from "../utils/uuid"

export type PendingLibraryOperation =
    | { kind: "upsert"; albumId: string; album: Album; operationId: string; queuedAt: string }
    | { kind: "delete"; albumId: string; operationId: string; queuedAt: string }
    | { kind: "cover-upload"; albumId: string; operationId: string; queuedAt: string }
    | { kind: "cover-delete"; albumId: string; operationId: string; queuedAt: string }

export type NewPendingLibraryOperation = PendingLibraryOperation extends infer Operation
    ? Operation extends PendingLibraryOperation
        ? Omit<Operation, "operationId" | "queuedAt">
        : never
    : never

function isOperation(value: unknown): value is PendingLibraryOperation {
    if (typeof value !== "object" || value === null) return false
    const operation = value as Partial<PendingLibraryOperation>
    return typeof operation.albumId === "string"
        && typeof operation.operationId === "string"
        && typeof operation.queuedAt === "string"
        && ["upsert", "delete", "cover-upload", "cover-delete"].includes(operation.kind ?? "")
        && (operation.kind !== "upsert" || typeof operation.album === "object")
}

export function loadPendingLibraryOperations(adapter: StorageAdapter): PendingLibraryOperation[] {
    const raw = adapter.get(STORAGE.LIBRARY_PENDING_OPERATIONS)
    if (!raw) return []
    try {
        const parsed = JSON.parse(raw) as unknown
        return Array.isArray(parsed) ? parsed.filter(isOperation) : []
    } catch {
        return []
    }
}

function save(adapter: StorageAdapter, operations: PendingLibraryOperation[]): void {
    if (operations.length === 0) {
        adapter.remove(STORAGE.LIBRARY_PENDING_OPERATIONS)
        return
    }
    adapter.set(STORAGE.LIBRARY_PENDING_OPERATIONS, JSON.stringify(operations))
}

export function enqueueLibraryOperation(
    adapter: StorageAdapter,
    operation: NewPendingLibraryOperation,
): PendingLibraryOperation {
    const queued = {
        ...operation,
        operationId: generateUUID(),
        queuedAt: new Date().toISOString(),
    } as PendingLibraryOperation
    const operations = loadPendingLibraryOperations(adapter)
    const conflicts = operation.kind.startsWith("cover-")
        ? new Set(["cover-upload", "cover-delete"])
        : new Set(["upsert", "delete"])
    const retained = operations.filter((candidate) =>
        candidate.albumId !== operation.albumId || !conflicts.has(candidate.kind),
    )
    retained.push(queued)
    save(adapter, retained)
    return queued
}

export function completeLibraryOperation(
    adapter: StorageAdapter,
    completed: PendingLibraryOperation,
): void {
    const operations = loadPendingLibraryOperations(adapter)
    save(adapter, operations.filter((candidate) =>
        !(candidate.albumId === completed.albumId
            && candidate.kind === completed.kind
            && candidate.operationId === completed.operationId),
    ))
}
