# Sprint 73 — Frontend Resilience

**Status:** Done

**Target version:** `v0.25.3-dev`

---

## Goal

The frontend survives API outages, timeouts, and network issues.

## Subsprints

| Subsprint | Focus | Status |
|-----------|-------|--------|
| [73A](./done/Sprint-73A.md) | API Resilience & Connection State | Done |
| [73B](./done/Sprint-73B.md) | Feedback Systems | Done |
| [73C](./done/Sprint-73C.md) | Export & Bindings Polish | Done |
| [73D](./done/Sprint-73D.md) | Scan Real Progress | Done |
| [73E](./done/Sprint-73E.md) | Integration & Audit | Done |

## Architecture Changes

None.

## Affected Components

- `ApiStorageAdapter` — retry logic, exponential backoff
- `useExport.ts` — state machine must not end in dead ends
- All pages — loading and error states audited
- `App.tsx` — global error boundary
- `BindingsPage.tsx` — tooltips and visual polish
- `src/styles/bindings.css` — button spacing and borders
- `DiagnosticsPanel` / Scan flow — real progress indicator instead of spinner

## Risks

- User confusion from unclear error messages
- Retry storms overwhelming a recovering API

## Definition of Done

- [x] API timeout after 10s with retry (max 3x)
- [x] Exponential backoff between retries
- [x] Offline indicator in header
- [x] No infinite loading spinners
- [x] Every API call has an error handler
- [x] Global error boundary catches React crashes
- [x] Toast/notification system for async operation results
- [x] Verify and Reconcile buttons have explanatory tooltips (EN/DE)
- [x] Bindings action buttons have increased spacing and visual borders
- [x] Verify tooltip explains: "Checks all confirmed bindings against the filesystem and marks missing folders"
- [x] Reconcile tooltip explains: "Promotes proposed bindings to confirmed when the folder still exists"
- [x] Scan shows real progress (directories scanned / total) instead of only a spinner
