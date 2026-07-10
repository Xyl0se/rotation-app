# Rotation

> Rotation begleitet die Beziehung zwischen Mensch und Musik.

Rotation ist eine ruhige, lokale React-Anwendung fuer eine bewusste Albumsammlung. Sie hilft dabei, die eigene Hoerbeziehung zu Alben ueber viele Jahre bewusst zu pflegen — nicht als Dateneingabe, sondern als Gespraech ueber Musik.

## Kernfunktionen

- **Alben entdecken**: Titel und Artist eingeben, Metadaten von MusicBrainz und Cover Art Archive nachschlagen.
- **Album Coach**: Ein kurzer Entscheidungsbaum ordnet das Album einer Rolle zu.
- **Bibliothek**: Alben als Cards, mit Perspektiven (Kuenstler, Jahr, Hoersession, Rollenaenderung).
- **Role Explorer**: Alle sechs Rollen als eigenstaendige, erkundbare Bereiche.
- **Fokusalbum**: Genau ein Album fuer Aufmerksamkeit hervorgehoben.
- **Listening History**: Hoersessions als echte Ereignisse, sichtbar in der Album-Timeline.
- **Player-Rotation**: Kuratierte Auswahl fuer den MP3-Player, mit Review und Ersatzvorschlaegen.
- **Reflection Engine**: Rotation stellt bei passenden Alben eine Frage fuer erneute Einordnung.
- **Archiv Workflow**: Bewusstes Loslassen mit Klassiker-Schutz und Wiederentdeckung.
- **Insights**: Sprachliche Erkenntnisse ueber die Sammlung statt Statistik-Dashboards.
- **Cover Override**: Manuelle Cover-Anpassung per Upload, URL oder Alternative aus dem Cover Art Archive.

## Tech Stack

- React 19
- TypeScript
- Vite
- Vitest
- Browser-`localStorage` (Persistenz)
- IndexedDB (Cover-Cache, Custom Covers)
- MusicBrainz & Cover Art Archive (Metadaten)

## Entwicklung starten

```bash
docker compose up -d --build
```

## Tests

```bash
npm test
```

## Projektstruktur

- `src/components/features/` — Feature-Komponenten (Library, Dashboard, Coach, etc.)
- `src/components/ui/` — Wiederverwendbare UI-Bausteine
- `src/domain/` — Komponentenfreie Domain-Logik
- `src/hooks/` — React-Hooks (useLibrary, useRotationPlan, useListenEvents)
- `src/repositories/` — Speicher-Abstraktionen (localStorage, IndexedDB)
- `src/services/` — Externe APIs (MusicBrainz, Cover Art Archive)
- `docs/` — Architektur, Produktnotizen, Changelog, ADRs

## Design

Rotation besitzt ein verbindliches Design System (`docs/DESIGN_SYSTEM.md`). Die visuelle Identitaet ist warm, reduziert und editorial — wie ein persoenliches Musikjournal, nicht wie ein Dashboard.

## Status

Aktuelle Version: `v0.19.0-dev`

Rotation befindet sich in aktiver Entwicklung. Die Domaene ist stabil, die Infrastruktur wird langfristig vorbereitet. Die Roadmap ist in `docs/ROADMAP.md` dokumentiert.
