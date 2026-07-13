# Sprint 73E — Integration & Audit

**Status:** Done

**Target version:** `v0.25.3-dev`

**Parent:** [Sprint 73](./Sprint-73.md)

---

## Goal

All frontend API calls have proper error handling. The resilience features from 73A–73D work together without conflicts. Sprint is documented and closed.

## Architecture Changes

None.

## Affected Components

- `src/hooks/useLibrary.ts` — error handler audit
- `src/hooks/useListenEvents.ts` — error handler audit
- `src/hooks/useRotationPlan.ts` — error handler audit
- `src/pages/HomePage.tsx` — loading/error state audit
- `src/pages/ExportPage.tsx` — loading/error state audit
- `src/services/api/` — all service modules verified against resilient client
- `docs/sprints/Sprint-73.md` — final status update

## Risks

- Missing edge case in some obscure page component
- Tests passing individually but failing in combination

## Definition of Done

- [x] Every `await` in frontend code is inside `try/catch` or uses the resilient client
- [x] No raw `fetch()` calls outside `apiClient.ts`
- [x] All pages have explicit loading and error UI states
- [x] No infinite spinners without timeout or error path
- [x] Toast integration verified on all async user actions
- [x] Connection context correctly reflects state across all pages
- [x] `Sprint-73.md` status updated to "Done"
- [x] All subsprint documents moved to `docs/sprints/done/`
- [x] CHANGELOG.md updated with v0.25.3-dev entries
- [x] Test suite passes: `npm test` (frontend) + `npm test` (server)

## Audit Checklist

### Hooks

| Hook | Has Error Handler | Shows Toast | Tests Pass |
|------|-------------------|-------------|------------|
| `useLibrary.ts` | ☐ | ☐ | ☐ |
| `useListenEvents.ts` | ☐ | ☐ | ☐ |
| `useRotationPlan.ts` | ☐ | ☐ | ☐ |
| `useExport.ts` | ☐ | ☐ | ☐ |

### Pages

| Page | Loading State | Error State | No Infinite Spinner |
|------|---------------|-------------|---------------------|
| `HomePage.tsx` | ☐ | ☐ | ☐ |
| `BindingsPage.tsx` | ☐ | ☐ | ☐ |
| `ExportPage.tsx` | ☐ | ☐ | ☐ |
| `WelcomePage.tsx` | ☐ | ☐ | ☐ |

### Services

| Service | Uses Resilient Client | Has Tests |
|---------|----------------------|-----------|
| `apiClient.ts` | ☐ (is the client) | ☐ |
| `bindingsService.ts` | ☐ | ☐ |
| `exportService.ts` | ☐ | ☐ |
| `diagnosticsService.ts` | ☐ | ☐ |
| `scanService.ts` | ☐ | ☐ |

## Smoke Test Scenarios

1. **Network drop during export preview**
   - Start export preview
   - Disconnect network
   - Expect: retry indicator, then error toast, no crash

2. **Network drop during staging**
   - Start staging
   - Disconnect network during copy
   - Expect: polling retries, then error state with recovery options

3. **Slow server during scan**
   - Trigger scan
   - Throttle network to 3G
   - Expect: progress updates still arrive, no timeout

4. **Offline on page load**
   - Load app with server down
   - Expect: offline indicator visible, diagnostics shows error, no white screen

5. **React crash simulation**
   - Temporarily throw in a component
   - Expect: ErrorBoundary catches it, friendly fallback shown
