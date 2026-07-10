# ADR 007: Role Explorer — Rollen als eigenstaendige Bereiche innerhalb der Bibliothek

## Status

Akzeptiert

## Kontext

Die Bibliothek zeigte Alben als flaches Raster. Nutzer konnten zwar nach Rolle filtern, aber die Rollen selbst hatten keine eigene Praesenz. Die Frage "Welche Alben erzaehlen gemeinsam dieselbe Geschichte?" liess sich nicht beantworten.

Sprint 49 sollte Rollen zu eigenstaendigen, erkundbaren Bereichen machen.

## Entscheidung

Jede der sechs Albumrollen erhaelt eine eigene Uebersichtsseite im Role Explorer.

- Der Role Explorer zeigt alle Rollen als Grid mit Icon, Titel, Beschreibung, Anzahl und Cover-Vorschau.
- Jede Rolle hat eine Detailansicht mit eigenem Header, Beschreibung und Album-Grid.
- Die Bibliothek erhaelt einen View Switcher, der zwischen "Alle Alben" und "Nach Rolle" wechselt.
- Album Cards koennen optional ein Rollen-Label anzeigen.
- Pro Rolle gibt es einen individuellen Empty State statt eines generischen Platzhalters.

## Konsequenzen

- Rollen sind nicht mehr nur Filterkriterien, sondern navigierbare Bereiche.
- `domain/roles/*` enthaelt Rollen-spezifische Logik und Nachrichten.
- `components/features/role-explorer` ist ein eigenstaendiger Feature-Schnitt.
- Neue Rollen erfordern Anpassungen im Explorer, im Switcher und in den Empty States.
