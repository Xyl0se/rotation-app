# Sprint 73 — Frontend Resilience

**Status:** Planned

**Target version:** `v0.25.3-dev`

---

## Goal

The frontend survives API outages, timeouts, and network issues.

## Architecture Changes

None.

## Affected Components

- `ApiStorageAdapter` — retry logic, exponential backoff
- `useExport.ts` — state machine must not end in dead ends
- All pages — loading and error states audited
- `App.tsx` — global error boundary
- `BindingsPage.tsx` — tooltips and visual polish
- `src/styles/bindings.css` — button spacing and borders

## Risks

- User confusion from unclear error messages
- Retry storms overwhelming a recovering API

## Definition of Done

- [ ] API timeout after 10s with retry (max 3x)
- [ ] Exponential backoff between retries
- [ ] Offline indicator in header
- [ ] No infinite loading spinners
- [ ] Every API call has an error handler
- [ ] Global error boundary catches React crashes
- [ ] Toast/notification system for async operation results
- [ ] Verify and Reconcile buttons have explanatory tooltips (EN/DE)
- [ ] Bindings action buttons have increased spacing and visual borders
