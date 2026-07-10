# ADR 008: Library Perspectives — Mehrere Blickwinkel auf dieselbe Sammlung

## Status

Akzeptiert

## Kontext

Die Bibliothek kannte nur zwei Ansichten: alle Alben oder nach Rolle gruppiert. Nutzer wollten jedoch auch nach Kuenstler, Jahr, Hoersession oder letzter Einordnung erkunden. Die Frage war nicht: "Was fehlt?", sondern: "Wie koennen wir dieselbe Sammlung aus verschiedenen Perspektiven zeigen, ohne die UI zu ueberladen?"

Sprint 50 sollte die Bibliothek um vier weitere Perspektiven erweitern.

## Entscheidung

Die Bibliothek unterstuetzt Perspektiven als verschiedene Blickwinkel auf dieselbe Datenmenge.

- Perspektiven sind Gruppierungen, keine Filter. Jedes Album erscheint in genau einer Gruppe pro Perspektive.
- Ein generisches `LibraryGroup<T>`-Modell beschreibt alle Perspektiven einheitlich.
- Der View Switcher bietet drei Hauptmodi: Alle, Nach Rolle, Perspektiven — mit Sub-Switcher fuer die vier Perspektiven.
- Perspektiven sind: Kuenstler, Jahr, letzte Hoersession, letzte Rollenaenderung.
- Zeitkategorien (Heute, Diese Woche, Dieser Monat, etc.) werden durch eine gemeinsame Hilfsfunktion `categorizeRecency()` berechnet.

## Konsequenzen

- Neue Perspektiven erfordern nur eine neue Gruppierungsfunktion und einen duennen Wrapper.
- `LibraryViewSwitcher` muss bei neuen Perspektiven erweitert werden.
- Die Domain bleibt komponentenfrei; Gruppierungslogik lebt in `domain/library-views/*`.
- Perspektiven sind bewusst keine komplexen Filter — sie zeigen die gesamte Sammlung umgruppiert.
