# Sprint 73D: Scan-Progress-Anzeige

**Status:** Done
**Date:** 2025-07-13
**Goal:** Scan-Laufzeit mit Live-Fortschritt im Frontend visualisieren

---

## Motivation

Bisher zeigte der Scan-Button während eines Scans nur einen statischen Text „Scan läuft…“. Bei größeren Musik-Sammlungen (10.000+ Alben) dauert ein Scan lange. Der Nutzer hat keine Rückmeldung, ob überhaupt gearbeitet wird.

---

## Result

### Backend

- `POST /api/scan` gibt jetzt `{ scanId, status }` zurück
- `GET /api/scan/:scanId/progress` liefert:
  ```
  {
    scanId: string,
    directoriesScanned: number,
    directoriesSkipped: number,
    status: "running" | "completed" | "failed"
  }
  ```
- In-Memory-Counter in `scanRunRepository.ts` (zweispaltig: scanned + skipped)
- `directoryScanner.ts` inkrementiert via `incrementCounters()` an den richtigen Stellen
- Cleanup bei Crash/Erfolg via `resetCounters()`

### Frontend

- `scanService.ts`: Neue Funktion `getScanProgress(scanId)` (GET ohne Write-Token)
- `DiagnosticsPanel.tsx`: Pollt alle 2 Sekunden auf `/scan/:id/progress`
  - Fallback auf generischen Text bei 404 (alte Server-Version)
  - Button-Label wechselt dynamisch:
    - Normal: „Ordner scannen" (DE) / „Scan folders" (EN)
    - Ohne Progress: „Scan läuft…"
    - Mit Progress: „Scan läuft… (42 Verzeichnisse gescannt, 5 übersprungen)"
- i18n: Neue Schlüssel `diagnostics.scanningWithProgress` in DE + EN
- Safety-Timeout: 60 Sekunden, dann wird der Polling-Zustand automatisch zurückgesetzt

---

## Acceptance Criteria

- [x] POST /scan gibt eine eindeutige Scan-ID zurück
- [x] GET /scan/:id/progress liefert Laufzeit-Status + Counter
- [x] Frontend pollt alle 2 Sekunden auf das Progress-Endpoint
- [x] Button zeigt gescannte + übersprungene Verzeichnisse live an
- [x] 404-Fehler führt zum Fallback auf statischen Text
- [x] Alle Tests bestehen

---

## Verification

```bash
# Type-Check (keine neuen Fehler)
npm run typecheck

# Vitest-Tests
npx vitest run --reporter=verbose
```

---

## Related

- Sprint 73C: Scan-Optimierung (Voraussetzung für diesen Sprint)
- Sprint 73E: Audit + Dokumentation
