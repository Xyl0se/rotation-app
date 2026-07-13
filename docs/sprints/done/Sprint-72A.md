# Sprint 72A — Domain-Layer: Robuste Grundlage

**Status:** Done ✅

**Target version:** `v0.25.2-dev`

**Parent Sprint:** [Sprint 72](./Sprint-72.md)

---

## Goal

Der Export-Domain-Layer ist gegen Dateisystem-Fehler und Pfad-Manipulationen resilient.

## Architecture Changes

- **Neu:** `next-rotation`-Verzeichnis als Zwischenschritt für atomares Apply (Variante A).
- `ExportStageResult` erweitert um `skippedSources: ExportSource[]`.

## Affected Components

- `server/src/domain/export/fileCopier.ts` — `calculateDirectorySize`, `countFiles`
- `server/src/domain/export/exportEngine.ts` — `previewExport`, `stageExport`, `applyExport`
- `server/src/infrastructure/filesystem/pathGuard.ts` — erweiterte Tests

## Risks

- Änderungen am Apply-Flow könnten bestehende Exporte beeinflussen, wenn `next-rotation` nicht korrekt bereinigt wird.
- `countFiles`/`calculateDirectorySize` könnten bei sehr großen Bibliotheken langsamer werden durch zusätzliche `try/catch`.

## Definition of Done

- [x] `calculateDirectorySize` und `countFiles` überspringen nicht lesbare Dateien/Verzeichnisse (EACCES/ENOENT) und loggen eine Warnung.
- [x] `stageExport` überspringt fehlende Quellverzeichnisse, kopiert die restlichen Alben und reportet `skippedSources`.
- [x] `applyExport` ist atomar: Nutzt `exports/next-rotation` als Zwischenziel und vervollständigt mit `renameSync(next-rotation → current-rotation)`.
- [x] `pathGuard.test.ts` deckt ab: Null-Byte-Injection, Symlink-Race-Conditions, Unicode-Normalisierung (NFC/NFD), `.`/`..`-Kombinationen.

## Tasks

| # | Task | Datei(en) | Details |
|---|------|-----------|---------|
| 1.1 | Size-Berechnung härten | `fileCopier.ts` | `calculateDirectorySize` & `countFiles` mit `try/catch` um `readdirSync`/`statSync`. Bei Fehler: Warnung loggen, 0 zurückgeben für den Teilbaum. |
| 1.2 | Fehlende Alben überspringen | `exportEngine.ts` | In `stageExport`: Vor `copyDirectory` prüfen, ob `source.absolutePath` existiert. Falls nicht: In `skippedSources` aufnehmen und fortsetzen. |
| 1.3 | Atomares Apply | `exportEngine.ts`, `fileCopier.ts` | `resolveNextRotationDir` hinzufügen. Ablauf: (a) Staging → `next-rotation` kopieren, (b) Manifest schreiben, (c) `current-rotation` archivieren, (d) `renameSync(next-rotation → current-rotation)`. |
| 1.4 | PathGuard erweitern | `pathGuard.test.ts` | Tests für Null-Byte, Symlink-Races, Unicode-Normalisierung, absolute Pfade innerhalb Base. |
