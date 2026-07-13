# Sprint 73B — Feedback Systems

**Status:** Done

**Target version:** `v0.25.3-dev`

**Parent:** [Sprint 73](./Sprint-73.md)

---

## Goal

Users receive clear, non-blocking feedback for all async operations. React rendering crashes are caught gracefully instead of white-screening the app.

## Architecture Changes

None.

## Affected Components

- `src/contexts/ToastContext.tsx` — new toast queue context
- `src/components/ui/Toast.tsx` — single toast component
- `src/components/ui/ToastContainer.tsx` — container + animations
- `src/components/ui/ErrorBoundary.tsx` — new global error boundary
- `src/main.tsx` — ErrorBoundary wraps `<App />`
- `src/hooks/useExport.ts` — toasts for export success/failure
- `src/pages/BindingsPage.tsx` — toasts for verify/reconcile/confirm/delete
- `src/components/features/diagnostics/DiagnosticsPanel.tsx` — toasts for scan state changes

## Risks

- Toast spam if too many async operations fire at once
- Error boundary catching errors that should be handled locally

## Definition of Done

- [x] `ToastContext` with FIFO queue (max 3 visible, auto-dismiss after 5s)
- [x] Toast types: `success`, `error`, `info`, `warning`
- [x] Position: top-center
- [x] `useToast()` hook available everywhere
- [x] Export operations show toast on success and error
- [x] Binding operations (confirm, delete, verify, reconcile) show toast on success/error
- [x] Scan state changes show toast when scan completes or fails
- [x] `ErrorBoundary` catches React rendering crashes
- [x] Fallback UI shows friendly error message + reload button (i18n)
- [x] Unit tests for ToastContext and ErrorBoundary

## Implementation Notes

### Toast Queue

```ts
interface Toast {
  id: string
  type: "success" | "error" | "info" | "warning"
  message: string
}
```

- New toasts pushed to end of queue
- Oldest toast removed when queue > 3
- Each toast auto-dismisses after 5000ms via `setTimeout`

### Error Boundary Fallback

```
┌─────────────────────────────┐
│  ⚠️ Something went wrong    │
│                             │
│  A problem occurred. Please │
│  reload the page to         │
│  continue.                  │
│                             │
│  [Reload Page]              │
└─────────────────────────────┘
```

- `errorBoundary.title`
- `errorBoundary.description`
- `errorBoundary.reload`
