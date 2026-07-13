# Sprint 73C — Export & Bindings Polish

**Status:** Done

**Target version:** `v0.25.3-dev`

**Parent:** [Sprint 73](./Sprint-73.md)

---

## Goal

The export state machine cannot get stuck in dead ends. The Bindings page is clearer through tooltips and improved visual hierarchy.

## Architecture Changes

None.

## Affected Components

- `src/hooks/useExport.ts` — staging timeout, recovery from error states
- `src/pages/BindingsPage.tsx` — tooltip props on Verify/Reconcile buttons
- `src/components/ui/Button.tsx` — `title` prop support
- `src/styles/bindings.css` — action button spacing and borders
- `src/i18n/locales/de.ts` / `en.ts` — tooltip translations, export timeout message

## Risks

- Timeout too aggressive for large libraries on slow NAS
- Tooltips may clutter the UI on mobile

## Definition of Done

- [x] Staging polling auto-aborts after 60s of no status change → `error` state
- [x] Error state offers two actions: "Retry from current step" and "Reset and start over"
- [x] Polling loop uses the resilient API client from 73A (retries on status fetch before giving up)
- [x] Verify button has `title` tooltip: "Checks all confirmed bindings against the filesystem and marks missing folders"
- [x] Reconcile button has `title` tooltip: "Promotes proposed bindings to confirmed when the folder still exists"
- [x] `.bindings-actions` container has visual border, padding `0.75rem`, gap `1rem`, background `#fafafa`
- [x] All new strings available in DE and EN
- [x] Unit tests for `useExport.ts` timeout and recovery paths

## Implementation Notes

### Export Timeout Logic

```ts
// In useExport.ts staging polling
const POLL_TIMEOUT_MS = 60000
const POLL_INTERVAL_MS = 500

let elapsed = 0
const interval = setInterval(async () => {
  elapsed += POLL_INTERVAL_MS
  if (elapsed >= POLL_TIMEOUT_MS) {
    stopPolling()
    setState(s => ({ ...s, step: "error", error: t.exportPage.stagingTimeout }))
    return
  }
  // ... existing status fetch
}, POLL_INTERVAL_MS)
```

### Bindings Actions Container

```css
.bindings-actions {
  display: flex;
  gap: 1rem;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: #fafafa;
  margin-bottom: 1rem;
}
```

### New i18n Keys

**de:**
```
exportPage.stagingTimeout: "Export-Vorbereitung hat das Zeitlimit überschritten. Bitte erneut versuchen."
bindings.verifyTooltip: "Prüft alle bestätigten Bindings gegen das Dateisystem und markiert fehlende Ordner"
bindings.reconcileTooltip: "Hebt vorgeschlagene Bindings zu bestätigten hoch, wenn der Ordner noch existiert"
```

**en:**
```
exportPage.stagingTimeout: "Export staging timed out. Please try again."
bindings.verifyTooltip: "Checks all confirmed bindings against the filesystem and marks missing folders"
bindings.reconcileTooltip: "Promotes proposed bindings to confirmed when the folder still exists"
```
