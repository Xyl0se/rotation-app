# ADR 010: Defensive Persistence — StorageQuotaError and Type Guards

## Status

Superseded by [ADR 014](./014-server-owned-rotation-state.md) and server-side
validation/persistence. Retained as historical context for the removed browser repository layer.

## Context

The application stores all user data in browser `localStorage`. This entails two risks:

1. **Storage exhausted:** `localStorage` has a hard limit (typically 5–10 MB). When exceeded, the browser throws `QuotaExceededError` (Chrome) or `NS_ERROR_DOM_QUOTA_REACHED` (Firefox).
2. **Corrupt data:** Users can manually manipulate the storage, or migrations can fail. Previously, invalid JSON led directly to app crashes.

## Decision

We introduce two defense mechanisms:

### 1. StorageQuotaError

A custom error type that carries the affected `key`:

```ts
class StorageQuotaError extends Error {
    key: string
}
```

The `localStorageAdapter` catches quota errors and throws `StorageQuotaError` instead of the raw browser error. Non-quota errors are passed through.

### 2. Defensive Type Guards in Repositories

Every repository validates loaded data with explicit type guards instead of blind casting:

- `albumRepository`: checks `id`, `title`, `artist`, `year`, `category` for type `string`, `roleHistory` for array structure
- `rotationPlanRepository`: checks `items[].albumId`, `albumIds[]`, `roleQuotas[].role`, `status`
- `listenEventRepository`: checks `id`, `albumId`, `timestamp`, `type`

Invalid entries are **silently ignored** (`warn`-only in the console), instead of crashing the entire app. The repository returns the remaining valid data set.

## Consequences

**Positive:**
- The app starts even with corrupt entries in `localStorage`.
- Storage errors are explicitly recognizable and can be handled in the UI in the future.
- Tests can simulate quota errors deterministically (via Memory Storage Adapter).

**Negative:**
- More boilerplate in the repositories (type guards).
- Silent ignoring can obscure data loss — therefore `console.warn` for every discarded entry.
- `StorageQuotaError` is currently not yet caught in the UI (technical debt).

## Alternatives

- **Schema validation with Zod:** Too heavy for our current needs; type guards are explicit and without runtime dependency.
- **Crash on invalid data:** Safer for developers, but poor user experience with manual storage manipulation.
