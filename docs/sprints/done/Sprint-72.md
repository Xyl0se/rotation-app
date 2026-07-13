# Sprint 72 — Export Safety & Edge Cases

**Status:** Done ✅

**Target version:** `v0.25.2-dev`

---

## Goal

The export flow is safe under all conditions.

## Sub-Sprints

Dieser Sprint wurde zur besseren Übersichtlichkeit in vier atomare Sub-Sprints aufgeteilt:

| Sub-Sprint | Fokus | Status |
|------------|-------|--------|
| [Sprint 72A](./Sprint-72A.md) | Domain-Layer: Robuste Grundlage | Done ✅ |
| [Sprint 72B](./Sprint-72B.md) | Application-Layer: Koordination & Recovery | Done ✅ |
| [Sprint 72C](./Sprint-72C.md) | Frontend: Transparenz & Recovery-UI | Done ✅ |
| [Sprint 72D](./Sprint-72D.md) | Tests & Dokumentation | Done ✅ |

## Architecture Changes

- **Neu:** `next-rotation`-Verzeichnis als Zwischenschritt für atomares Apply (Variante A).
- `ExportStageResult` / `StagingProgress` erweitert um `skippedSources: ExportSource[]`.
- `CrashRecovery` erkennt `exports/next-rotation` als Indikator für unterbrochenen Apply.

## Affected Components

- `ExportService` — what happens when an album is deleted during export?
- `ExportLock` — what happens on Docker restart during Apply?
- `PathGuard` — symlink attacks, path traversal
- `ExportPage.tsx` — better error states and recovery UI

## Risks

- Data loss in the export folder (Syncthing might sync during Apply)
- Partial copy leaves staging in inconsistent state

## Definition of Done

- [x] Export can continue when an album is missing (skip + report) → [72A](./Sprint-72A.md)
- [x] Apply is atomic even on `kill -9` of the container → [72A](./Sprint-72A.md)
- [x] PathGuard rejects any path manipulation attempts → [72A](./Sprint-72A.md)
- [x] Archives older than 30 days are automatically cleaned up → [72B](./Sprint-72B.md)
- [x] Staging directories are cleaned up after failed exports → [72B](./Sprint-72B.md)
- [x] Export size calculation handles unreadable files gracefully → [72A](./Sprint-72A.md)
