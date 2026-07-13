# Sprint 72 — Export Safety & Edge Cases

**Status:** Planned

**Target version:** `v0.25.2-dev`

---

## Goal

The export flow is safe under all conditions.

## Architecture Changes

None.

## Affected Components

- `ExportService` — what happens when an album is deleted during export?
- `ExportLock` — what happens on Docker restart during Apply?
- `PathGuard` — symlink attacks, path traversal
- `ExportPage.tsx` — better error states and recovery UI

## Risks

- Data loss in the export folder (Syncthing might sync during Apply)
- Partial copy leaves staging in inconsistent state

## Definition of Done

- [ ] Export can continue when an album is missing (skip + report)
- [ ] Apply is atomic even on `kill -9` of the container
- [ ] PathGuard rejects any path manipulation attempts
- [ ] Archives older than 30 days are automatically cleaned up
- [ ] Staging directories are cleaned up after failed exports
- [ ] Export size calculation handles unreadable files gracefully
