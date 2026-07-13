# Sprint 72D — Tests & Dokumentation

**Status:** Done ✅

**Target version:** `v0.25.2-dev`

**Parent Sprint:** [Sprint 72](./Sprint-72.md)

**Depends on:** [Sprint 72C](./Sprint-72C.md)

---

## Goal

Alle Änderungen aus Sprint 72A–72C sind durch Tests abgedeckt und dokumentiert.

## Architecture Changes

None. Reine Test- und Dokumentationsarbeit.

## Affected Components

- `server/src/domain/export/exportEngine.test.ts`
- `server/src/domain/export/fileCopier.test.ts` (neu)
- `server/src/application/crashRecovery.test.ts` (neu)
- `docs/sprints/Sprint-72.md`

## Risks

- Temporäre Dateien/Verzeichnisse in Tests könnten bei Fehlschlägen zurückbleiben (Cleanup notwendig).
- E2E-Tests für Crash-Recovery sind aufwändig zu automatisieren (Container-Restart simulieren).

## Definition of Done

- [ ] `exportEngine.test.ts` deckt ab: Album-Ordner fehlt → wird übersprungen; atomares Apply via `next-rotation`; Size-Berechnung mit unlesbarem Unterverzeichnis.
- [ ] `fileCopier.test.ts` (neu) testet `calculateDirectorySize` und `countFiles` mit `EACCES`/`ENOENT`.
- [ ] `crashRecovery.test.ts` (neu) testet: next-rotation-Recovery, 30-Tage-Archiv-Cleanup, 24h-Staging-Cleanup.
- [ ] `Sprint-72.md` ist als Meta-Dokument aktualisiert und verlinkt auf 72A–72D.
- [ ] Alle Tests im Server-Package passieren (`npm test` im `server/`-Ordner).

## Tasks

| # | Task | Datei(en) | Details |
|---|------|-----------|---------|
| 4.1 | exportEngine Tests | `exportEngine.test.ts` | Test: fehlendes Album → `skippedSources` enthält Album. Test: atomares Apply → `next-rotation` wird erstellt und per `renameSync` zu `current-rotation`. Test: Size-Berechnung mit unlesbarem Verzeichnis → kein Crash. |
| 4.2 | fileCopier Tests | `fileCopier.test.ts` (neu) | Test: `calculateDirectorySize` mit `chmod 000`-Verzeichnis (oder simuliert via Mock/Temp). Test: `copyDirectory` bei `EACCES`. |
| 4.3 | crashRecovery Tests | `crashRecovery.test.ts` (neu) | Test: next-rotation existiert, current-rotation fehlt → Recovery vervollständigt. Test: beide existieren → next-rotation gelöscht. Test: Archiv >30d gelöscht. Test: Staging >24h gelöscht. |
| 4.4 | Dokumentation | `docs/sprints/Sprint-72.md` | Meta-Dokument aktualisieren: Status, Architektur-Änderungen, Verlinkungen zu 72A–72D, DOD-Checkliste abhaken. |
