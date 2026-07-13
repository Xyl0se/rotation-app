# Sprint 71 — Binding & Scan Robustness

**Status:** Planned

**Target version:** `v0.25.2-dev`

---

## Goal

Bindings and scan are reliable under real-world conditions.

## Architecture Changes

None. Bugfixes and edge-case handling only.

## Affected Components

- `ScanService` — empty directories, special characters in paths, permission denied
- `BindingRepository` — race conditions during parallel scans
- `BindingsPage.tsx` — UI feedback for long scans (>30s)

## Risks

- NAS filesystem behavior (NFS, case-sensitivity) differs from local dev setup
- Large music libraries may cause timeouts

## Definition of Done

- [ ] Scan completes even when `/music` is temporarily unreachable
- [ ] `missing` bindings are reliably detected
- [ ] No unhandled rejections in the scan flow
- [ ] UI shows scan progress instead of only a spinner
- [ ] Special characters in folder names (umlauts, spaces, brackets) are handled
- [ ] Scan is idempotent: running twice produces the same result
