# Sprint 72C — Frontend: Transparenz & Recovery-UI

**Status:** Done ✅

**Target version:** `v0.25.2-dev`

**Parent Sprint:** [Sprint 72](./Sprint-72.md)

**Depends on:** [Sprint 72B](./Sprint-72B.md)

---

## Goal

Nutzer sehen, wenn Alben übersprungen wurden, können fehlgeschlagene Exports wiederholen und erhalten klare Rückmeldung über den Systemzustand.

## Architecture Changes

- `StagingProgress` im API-Schema erweitert um `skippedSources`.
- Neuer ExportStep `"staged_with_warnings"` im `useExport`-Hook (alternativ: Warnung innerhalb von `"staged"`).

## Affected Components

- `src/services/api/exportService.ts` — API-Typen
- `src/hooks/useExport.ts` — skippedSources, Retry-Logik
- `src/pages/ExportPage.tsx` — Warn-Boxen, Retry-Button, Recovery-Hinweis
- `src/i18n/locales/*.ts` — neue Übersetzungskeys

## Risks

- UI-Änderungen könnten bestehende E2E-Tests (sofern vorhanden) brechen.
- Übersetzungskeys müssen in alle unterstützten Sprachen eingepflegt werden; fehlende Keys führen zu Fallback-Texten.

## Definition of Done

- [x] API-Response (`/exports/:id/status`) enthält `skippedSources`.
- [x] `useExport` zeigt Warnungen an, wenn Alben während Stage übersprungen wurden.
- [x] `ExportPage` hat einen Retry-Button für fehlgeschlagene Staging-Versuche.
- [x] `ExportPage` zeigt einen Hinweis, wenn CrashRecovery einen vorherigen Export wiederhergestellt hat.
- [x] Alle neuen UI-Texte sind über i18n übersetzt.

## Tasks

| # | Task | Datei(en) | Details |
|---|------|-----------|---------|
| 3.1 | API-Schema erweitern | `src/services/api/exportService.ts`, `server/src/routes/exports.ts` | `StagingProgress` um `skippedSources: Array<{ albumId, relativePath }>` erweitern. Route gibt das Feld mit zurück. |
| 3.2 | useExport-Hook | `src/hooks/useExport.ts` | `StagingProgress` mit `skippedSources` verarbeiten. Wenn `status === "staged"` und `skippedSources.length > 0`: zusätzliche Warnung setzen. Retry-Funktion für fehlgeschlagene Stage hinzufügen. |
| 3.3 | ExportPage UI | `src/pages/ExportPage.tsx` | - Warn-Box für übersprungene Alben (ähnlich missing/unconfirmed bindings).<br>- Retry-Button im Error-State.<br>- Hinweis-Banner, wenn CrashRecovery einen Export wiederhergestellt hat (z.B. via Startup-Info vom Server). |
| 3.4 | i18n Keys | `src/i18n/locales/*.ts` | Neue Keys: `skippedAlbums`, `skippedAlbumsDescription`, `retryStaging`, `continueAnyway`, `recoveryNotice`, `crashRecoveryDismiss`. |
