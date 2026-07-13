# Sprint 72B — Application-Layer: Koordination & Recovery

**Status:** Done ✅

**Target version:** `v0.25.2-dev`

**Parent Sprint:** [Sprint 72](./Sprint-72.md)

**Depends on:** [Sprint 72A](./Sprint-72A.md)

---

## Goal

ExportService und CrashRecovery koordinieren fehlerfrei mit dem Domain-Layer und erkennen bzw. reparieren unterbrochene Exporte.

## Architecture Changes

- `StagingProgress` / `ExportStageResult` erweitert um `skippedSources`.
- CrashRecovery erkennt das neue `next-rotation`-Verzeichnis als Indikator für einen unterbrochenen Apply.

## Affected Components

- `server/src/application/exportService.ts` — skippedSources durchreichen, Rollback-Verifikation
- `server/src/application/crashRecovery.ts` — next-rotation-Recovery, Staging-Cleanup
- `server/src/infrastructure/persistence/sqlite/exportOperationRepository.ts` — ggf. `skipped_album_ids` speichern

## Risks

- CrashRecovery könnte fälschlicherweise ein gültiges `next-rotation` als unterbrochenen Apply interpretieren, falls ein Nutzer parallel manuell im Dateisystem arbeitet.
- Lock-Expiry bei Docker-Restart: Wenn der Container neu startet während ein Lock gültig ist, könnte ein zweiter Export gestartet werden, bevor der erste fertig ist.

## Definition of Done

- [x] `ExportService.runStage` gibt `skippedSources` über den In-Memory-Job zurück.
- [x] `CrashRecovery` erkennt `exports/next-rotation`: vervollständigt den Apply via `renameSync`, falls `current-rotation` fehlt; bereinigt `next-rotation`, falls beide existieren.
- [x] `CrashRecovery` testet die next-rotation-Logik mit Unit-Tests.
- [x] `ExportService` stellt sicher, dass `rollbackStaging` bei Stage-Fehlern aufgerufen wird und der Lock trotzdem freigegeben wird (auch wenn Rollback selbst fehlschlägt).

## Tasks

| # | Task | Datei(en) | Details |
|---|------|-----------|---------|
| 2.1 | skippedSources durchreichen | `exportService.ts`, `exportEngine.ts` | `StagingProgress` und ggf. `ExportStageResult` um `skippedSources` erweitern. `runStage` speichert diese im In-Memory-Job. |
| 2.2 | CrashRecovery: next-rotation | `crashRecovery.ts` | Prüfen, ob `exports/next-rotation` existiert. Falls ja und `current-rotation` fehlt: `renameSync(next-rotation → current-rotation)`. Falls beide existieren: `next-rotation` löschen. |
| 2.3 | CrashRecovery: Tests | `crashRecovery.test.ts` (neu) | Test: next-rotation existiert, current-rotation fehlt → Recovery. Test: beide existieren → next-rotation bereinigt. Test: 30d-Archiv-Cleanup, 24h-Staging-Cleanup. |
| 2.4 | Rollback-Verifikation | `exportService.ts` | Sicherstellen, dass `rollbackStaging` im `catch` von `runStage` aufgerufen wird. Falls `rollbackStaging` fehlschlägt: Fehler loggen, Lock trotzdem freigeben, Status auf `rolled_back`. |
