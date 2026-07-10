# Architektur

Features besitzen keine Daten.

Features bearbeiten Daten.

---

## Produkt- und Domänenprinzip

Rotation unterscheidet bewusst zwischen **Bibliothek** und **Player-Rotation**.

Die Bibliothek dokumentiert die persönliche Beziehung zwischen Mensch und Album.

Sie wird **nicht bewertet**.

Albumrollen besitzen **keine Zielgrößen**, **keine optimale Verteilung** und **keine empfohlene Balance**.

Die Player-Rotation ist eine bewusst kuratierte Auswahl aus der Bibliothek.

Reflection, Explainability und zukünftige Empfehlungen beziehen sich ausschließlich auf diese aktive Player-Rotation – niemals auf die Größe einzelner Rollen innerhalb der Bibliothek.

---

## Technischer Rahmen

- React 19
- TypeScript
- Vite
- Browser-`localStorage`
- IndexedDB (Cover-Cache, Custom Covers)
- Externe Metadaten: MusicBrainz und Cover Art Archive

---

## Domänenmodell

Rotation kennt zwei klar getrennte Ebenen.

### Bibliothek

Die Bibliothek beschreibt die vollständige Albumsammlung.

Albumrollen dokumentieren die aktuelle Beziehung zwischen Nutzer und Album.

Es existieren keine Zielgrößen oder optimale Verteilungen.

Die Bibliothek dient als Grundlage für:

- Reflection
- Timeline
- Insights
- Player-Rotation

Sie wird selbst nicht bewertet.

### Player-Rotation

Die Player-Rotation ist eine bewusst kuratierte Auswahl aus der Bibliothek.

Diese Auswahl darf:

- erklärt werden
- reflektiert werden
- später intelligent unterstützt werden

Empfehlungen beziehen sich ausschließlich auf diese Ebene.

---

## Aktuelle Datenführung

`App.tsx` entscheidet, ob die Willkommen-Seite oder die HomePage angezeigt wird. Der Onboarding-Status liegt unter `STORAGE.ONBOARDING` im `localStorage`.

`HomePage.tsx` ist der zentrale Container. Sie komponiert Features und reicht Daten und Callbacks durch Props weiter. Direkter `localStorage`-Zugriff existiert nicht mehr in der Page-Komponente.

Die Bibliothekslogik lebt in `useLibrary.ts` (ADR 004). Der Hook kapselt:

- Laden, Speichern und Normalisieren von Alben
- CRUD-Operationen (`addAlbum`, `updateAlbum`, `deleteAlbum`)
- Cover-Override-Management
- Fokusalbum-Verwaltung
- Rollenaktualisierung

Die Hörhistorie lebt in `useListenEvents.ts`.

Der Hook kapselt:

- Laden und Migrieren von Legacy-Hördaten
- Erfassen neuer Hörsessions
- Normalisierung von `listenCount` und `lastListened`

Der RotationPlan lebt in `useRotationPlan.ts`.

Der Hook kapselt:

- Generieren von Player-Rotationen
- Annehmen und Verwerfen
- Modifizieren
- Ersatzkandidaten-Suche
- Dualen Speicher (`draft` / `active`)

---

## Albummodell

Ein Album besteht aktuell aus:

- id
- title
- artist
- year
- category
- coverUrl
- coverOverride
- roleHistory
- listenCount
- lastListened

`category` wird durch Album Coach, Reflection oder Archiv Workflow gesetzt.

`roleHistory` dokumentiert bewusst nachvollziehbar die Entwicklung dieser Beziehung.

Die aktuelle Rolle beschreibt ausschließlich die Beziehung zwischen Mensch und Album.

Sie dient **nicht** zur Bewertung der Sammlung.

`listenCount` und `lastListened` sind Legacy-Felder zur Kompatibilität.

Die eigentliche Hörhistorie liegt in `listenEvents`.

`coverOverride` ist eine discriminated union:

- `type: "url"`
- `type: "custom"`

`coverUrl` bleibt das Original aus MusicBrainz / Cover Art Archive.

`coverOverride` überschreibt dieses bewusst.

Die eigentliche Player-Rotation wird als `RotationPlan` gespeichert.

Ein RotationPlan beschreibt eine konkrete Auswahl mehrerer Alben inklusive Auswahlgrund.

---

## Feature-Schnitt

- discover-album
- album-coach
- archive
- dashboard (Reflection, Insights und neutrale Rollenübersicht)
- library
- library dialogs
- focus-album
- player-rotation
- insights
- timeline
- reflection
- role-explorer
- ui

Der Bereich `rotation-dashboard` dient ausschließlich als Einstiegspunkt für Reflection, Insights und Explainability.

Er bewertet die Bibliothek nicht.

---

## Domain-Schnitt

### Rollen

`domain/roles.ts`

Kanonische Albumrollen.

---

### Album

`domain/album/*`

Coach-Fragen

Coach-Auswertung

Rollenermittlung

---

### Archiv

`domain/archive/*`

Archivschutz

Wiederentdeckung

Archivfragen

---

### Dashboard

`domain/dashboard/*`

Zusammenstellung der Dashboard-Bausteine.

Sprachliche Zusammenfassungen.

Keine Bewertungslogik.

---

### Insights

`domain/insights/*`

Sprachliche Beobachtungen über Sammlung und Hörverhalten.

---

### Timeline

`domain/timeline/*`

Ableitung dokumentierter Albumgeschichte.

---

### Rotation

`domain/rotation/*`

Domänenlogik rund um die aktive Player-Rotation.

Dieser Bereich beschreibt die Auswahl einer Rotation.

Er bewertet ausdrücklich nicht die Bibliothek.

Langfristig entsteht hier Explainability der Rotation.

---

### RotationPlan

`domain/rotation-plan/*`

Generator und Zielmodell der Player-Rotation.

---

### Reflection

`domain/reflection/*`

Regeln und Texte für bewusste Neueinordnungen einzelner Alben.

---

### Library Views

`domain/library-views/*`

Gruppierungslogik für Perspektiven.

---

Domain-Code bleibt vollständig komponentenfrei und separat testbar.

---

## Service-Schnitt

React-Komponenten sprechen ausschließlich mit `searchAlbum`.

Dieser Service kapselt:

- MusicBrainz
- Cover Art Archive

Externe APIs bleiben dadurch vollständig außerhalb der Features.

---

## Cover Management

Albumcover werden als eigenständige Ressource behandelt.

`AlbumCover` ist die zentrale Komponente für sämtliche Coverdarstellungen.

### Cache

- IndexedDB
- Blob Cache
- Offlinefähig
- Netzwerkreduzierung

### Custom Covers

Separater Store:

- saveCustomCover
- getCustomCover
- removeCustomCover

### Priorität

1. coverOverride URL
2. coverOverride Custom
3. coverUrl
4. Placeholder

---

## Migration Registry

Migrationen werden deklarativ registriert.

Eigenschaften:

- versioniert
- inkrementell
- idempotent
- testbar

Neue Migration:

1. Funktion schreiben
2. registrieren
3. SCHEMA_VERSION erhöhen
4. Tests ergänzen

---

## Data Integrity Layer

Drei Verteidigungslinien:

### Adapter

Transport

Quota Errors

StorageQuotaError

### Repository

Type Guards

Defensives Laden

Normalisierung

### Normalisierung

Legacy-Felder

Migration

Bereinigung

---

## Architekturprinzipien

Die Architektur folgt einigen grundlegenden Regeln.

### Bibliothek dokumentiert.

Nicht bewerten.

### Rollen beschreiben Beziehungen.

Nicht Kategorien.

Nicht Quoten.

### Dashboard beobachtet.

Nicht optimieren.

### Reflection begleitet.

Nicht korrigieren.

### Explainability erklärt Entscheidungen.

Nicht Regeln.

---

## Bekannte Architektur-Schuld

- `listenCount` und `lastListened` sind Legacyfelder und sollen langfristig vollständig aus `listenEvents` abgeleitet werden.
- `StorageQuotaError` wird aktuell noch nicht bis in die UI kommuniziert.
- Teile der Dashboard-Domäne basieren noch auf historischer Rollen-Balance. Diese Logik wird in einem späteren Sprint vollständig entfernt und durch Explainability der Player-Rotation ersetzt.