# Versioning

Rotation nutzt ab `v0.3.0-dev` eine sprintorientierte Versionierung.

Die fruehen Tags bleiben als historische Marker bestehen. Es werden keine Versionen rueckwirkend ergaenzt.

## Aktueller Anker

`v0.8.0-dev` markiert Sprint 44: Rotation kann eine erste konkrete Player-Auswahl generieren und sichtbar anzeigen.

Enthalten sind:

- Album Coach
- Rotation Engine
- Rotation Dashboard
- Role History
- Reflection Engine
- Archiv Workflow
- Album Timeline
- Library Maintenance
- Insights
- Dashboard 2.0
- Hoersession auf Album Cards
- Curated Rotation Model
- Fokusalbum
- Rotation Generator MVP
- Player-Rotation

## Regel

Groessere Produktsprints erhoehen die Minor-Version.

Kleinere Korrekturen und Polishing innerhalb eines Sprints erhoehen die Patch-Version.

## Geplante Linie

- Sprint 45 Rotation Review: `v0.9.0-dev`
- Sprint 46 Listening History: `v0.10.0-dev`
- Sprint 47 Persistence Readiness: `v0.11.0-dev`

Patch-Beispiele:

- `v0.6.1-dev`: kleiner Produkt-Fix vor Sprint 43
- `v0.7.1-dev`: Begriffsklaerung oder UI-Polish innerhalb des Curated-Rotation-Modells

## Release-Ablauf

1. `package.json` und `package-lock.json` auf die Zielversion setzen.
2. `docs/CHANGELOG.md` von `Unreleased` auf die Zielversion schneiden.
3. Lint und Build ausfuehren.
4. Versionierungs-Commit erstellen.
5. Git-Tag mit der Zielversion setzen.
6. Der naechste Sprint startet wieder unter `Unreleased`.
