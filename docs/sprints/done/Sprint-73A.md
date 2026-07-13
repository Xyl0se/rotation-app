# Sprint 73A — API Resilience & Connection State

**Status:** Done

**Target version:** `v0.25.3-dev`

**Parent:** [Sprint 73](./Sprint-73.md)

---

## Goal

All API calls survive timeouts, network drops, and temporary server unavailability through retry logic with exponential backoff. The user always knows whether the app is online or offline.

## Architecture Changes

None.

## Affected Components

- `src/services/api/apiClient.ts` — retry wrapper, timeout handling
- `src/services/api/retryFetch.ts` — new retry utility
- `src/contexts/ConnectionContext.tsx` — new connection state context
- `src/components/ui/OfflineIndicator.tsx` — new visual indicator
- `src/App.tsx` — provider wiring + indicator placement

## Risks

- Retry storms overwhelming a recovering API
- False negatives when the server is genuinely down vs. temporarily slow

## Definition of Done

- [x] `AbortController` enforces 10s timeout on every API call
- [x] Retry wrapper retries max 3x with exponential backoff (1s → 2s → 4s)
- [x] Retry only triggers on network errors, timeouts, and 5xx — never on 4xx
- [x] `navigator.onLine` respected: offline = immediate failure, no retry
- [x] `ApiError` extended with `retryable: boolean`
- [x] `ConnectionContext` tracks `isOnline`, `isRetrying`, `retryCount`
- [x] Offline indicator renders in header nav when `isOnline === false`
- [x] Retry state visible during backoff (e.g. subtle spinner or dot)
- [x] Unit tests for `retryFetch.ts`: timeout simulation, retry count, backoff timing, 4xx non-retry

## Implementation Notes

### Retry Strategy

```
fetch() with AbortController(10s)
  → ok? return response
  → 4xx? throw immediately (no retry)
  → 5xx / timeout / network error?
      attempt 1: wait 1000ms, retry
      attempt 2: wait 2000ms, retry
      attempt 3: wait 4000ms, retry
      → still failing? throw final error
```

### ConnectionContext Shape

```ts
interface ConnectionState {
  isOnline: boolean
  isRetrying: boolean
  retryCount: number
  lastError: string | null
}
```

### Offline Indicator

- Position: left side of the nav bar, next to the app title or before nav buttons
- Visual: red dot + "Offline" text (i18n: `nav.offline`)
- Auto-hides when connection recovers
