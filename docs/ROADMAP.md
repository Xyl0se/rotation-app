# Rotation Roadmap

> Rotation ist kein Werkzeug zum Verwalten einer Musiksammlung.
>
> Rotation begleitet die Beziehung zwischen Mensch und Album.

Version: v0.18.x-dev

---

# Produktleitlinie

Rotation verfolgt seit Version 0.16 eine klare Produktphilosophie.

Die Bibliothek dokumentiert Beziehungen.

Sie wird nicht bewertet.

Albumrollen besitzen keine Zielgrößen.

Es existieren keine optimale Rollenverteilung.

Es gibt keine „perfekte Sammlung“.

Die Player-Rotation ist eine bewusst kuratierte Auswahl aus der Bibliothek.

Reflection unterstützt Entscheidungen.

Explainability erklärt Entscheidungen.

Das Dashboard schafft Aufmerksamkeit.

Nicht Optimierung.

Alle zukünftigen Entwicklungen orientieren sich an diesen Prinzipien.

---

# Aktueller Produktstand

Rotation besitzt heute folgende Kernfunktionen.

## Sammlung

- Album entdecken
- MusicBrainz Lookup
- Cover Art Archive
- Cover Override
- Album Coach
- Rollenmodell
- Role History
- Timeline
- Listening History
- Archiv
- Wiederentdeckung

## Bibliothek

- Editor
- Role Explorer
- Library Perspectives
- Suche vorbereitet
- Cover Cache
- Persistenz

## Rotation

- Fokusalbum

- Player-Rotation

- Rotation Review

- RotationPlan

## Dashboard

- Reflection

- Insights

- Rollenübersicht

## Infrastruktur

- Repository Pattern

- Storage Adapter

- Migration Registry

- IndexedDB

- Persistenz

- Defensive Loading

- Testabdeckung >200 Tests

---

# Abgeschlossene Entwicklungsphasen

## Phase I

Foundation

Grundlagen der React-Anwendung.

---

## Phase II

Discover Experience

Album Discovery

MusicBrainz

Album Coach

Metadaten

---

## Phase III

Living Library

Role History

Timeline

Reflection

Archiv

Listening History

---

## Phase IV

Curated Rotation

Player-Rotation

Rotation Review

RotationPlan

Role Explorer

Library Perspectives

---

## Phase V

Design System

Editorial UI

Moleskine Design

Interaction Design

Micro UX

---

## Phase VI

Persistence

Repositories

Storage Adapter

Migration Registry

Cover Cache

Data Integrity

---

# Aktuelle Architektur

Rotation besteht aus zwei klar getrennten Ebenen.

## Bibliothek

Die Bibliothek beschreibt die gesamte Albumsammlung.

Albumrollen dokumentieren Beziehungen.

Die Bibliothek besitzt keine Zielgrößen.

Sie wird nicht bewertet.

Sie dient als Grundlage für:

- Reflection

- Timeline

- Insights

- Player-Rotation

---

## Player-Rotation

Die Player-Rotation ist eine bewusst kuratierte Auswahl.

Sie darf erklärt werden.

Sie darf reflektiert werden.

Sie darf zukünftig intelligent unterstützt werden.

Empfehlungen beziehen sich ausschließlich auf diese Ebene.

---

# Nächste Entwicklungsphase

## Phase VII

From Dashboard to Companion

Rotation entwickelt sich von einer Sammlung hin zu einem musikalischen Begleiter.

---

# Sprint 57 — Klassiker- und Archivlogik überarbeiten

**Status:** Abgeschlossen

**Zielversion:** `v0.18.0-dev`

## Ergebnis

- Neuer Album Coach: deterministischer Baum mit 8 möglichen Fragen, keine Pflicht-Fragenkette mehr
- Classic hat Vorrang vor comfort-food und growing (prägende Wirkung als primäres Signal)
- Archivschutz: `hasBiographicPlace` statt `wouldRecommend` — persönliche Klassiker bleiben geschützt
- Partielle Antworten: `AlbumCoachAnswers = Partial<AlbumCoachAnswerValues>`
- Rollendefinitionen präzisiert: `classic` = dauerhaft prägend, `admire` = musikalisch geschätzt ohne Nähe, `archive` = darf ruhen
- Details im [CHANGELOG](CHANGELOG.md)

---
# Sprint 58 — Self Hosted Rotation

## Status: Geplant

## Zielversion: v0.19.x-dev

## Ziel

Rotation wird erstmals unabhängig vom lokalen Entwicklungsrechner betrieben.
Die Anwendung kann auf einem Server laufen und von mehreren Geräten im Heimnetz oder Internet genutzt werden.
Dabei bleiben alle Produktprinzipien erhalten.
Die bestehende Bibliothek kann vollständig übernommen werden.

## 58A — Deployment Foundation

### Ziel

Rotation wird produktionsfähig gebaut.

Nicht mehr nur npm run dev.

### Themen

* Production Build
* Dockerfile
* Docker Compose
* nginx oder Caddy als Webserver
* Environment-Konfiguration
* Healthcheck
* Persistentes Datenverzeichnis vorbereiten

### Ergebnis
Rotation läuft per docker compose up im Browser.
Noch vollständig lokal.
Keine Datenbank.
Keine API.

### Nicht Bestandteil
* Benutzerverwaltung
* Datenbank
* Migration


## 58B — Server Persistence

### Ziel
Die Browser-Persistenz wird durch eine echte Serverpersistenz ergänzt.
Die Architektur bleibt Repository-basiert.

### Architektur

#### Heute:
React
↓
StorageAdapter
↓
localStorage

#### Neu:
React
↓
Repository
↓
REST API
↓
Persistence Service
↓
SQLite

SQLite halte ich für den perfekten ersten Schritt.

Warum?
* keine Serverinstallation
* Backups trivial
* Dockerfreundlich
* Millionenfach bewährt
* später problemlos auf PostgreSQL migrierbar

### Themen

#### Backend
* kleines Node Backend
* REST API
* Repository Layer
* SQLite

#### Frontend
* ApiStorageAdapter
* bestehende Repository Interfaces weiterverwenden

### Ergebnis
Die Anwendung arbeitet vollständig gegen eine Datenbank.

### Nicht Bestandteil
Noch keine Benutzer.


## 58C — Datenmigration

### Ziel
Bestehende lokale Bibliotheken übernehmen.

### Import-Assistent
Beim ersten Start erkennt Rotation:
Es existieren lokale Daten.
Der Nutzer bekommt: Möchtest du deine Bibliothek übernehmen?

Importiert werden:
* Alben
* Storys
* Role History
* Listening History
* Rotation Plans
* Reflection
* Cover Overrides

Danach werden lokale Daten optional gelöscht.

### Cover Migration
Besonders wichtig.
Heute liegen Cover
* localStorage
* IndexedDB
Später
SQLite + Filesystem
oder
SQLite + Blob Storage
Ich würde nicht in der Datenbank speichern.

Sondern:
/covers/
album-id.webp
Die DB enthält nur den Pfad.

Ergebnis
Bestehende Installationen können vollständig migrieren.

## 58D — Home Server Edition

### Ziel
Rotation fühlt sich wie eine “echte” Anwendung an.

### Themen
* Automatische Backups -> backup/rotation-2026-08-31.sqlite
* Export -> rotation-backup.zip
* Import -> rotation-backup.zip
* Healthcheck -> /health
* Docker Volumes
* Konfiguration
* .env

### Ergebnis
Rotation kann dauerhaft auf einem NAS,
Mini-PC,
Raspberry Pi
oder Heimserver laufen.

## Architekturziel

Nach Sprint 58 sieht Rotation ungefähr so aus:

                Browser
                    │
            React Frontend
                    │
           Repository Pattern
                    │
             REST API Layer
                    │
         Persistence Service
         ├───────────────┐
         │               │
      SQLite        Cover Storage
                        │
                 Original Covers
                 Custom Covers
                 Cache

⸻

## Definition of Done
* Rotation läuft vollständig in Docker
* Anwendung ist ohne Entwicklungsserver nutzbar
* SQLite ersetzt Browser-Persistenz
* Repository-Pattern bleibt erhalten
* Bestehende lokale Bibliothek kann vollständig migriert werden
* Cover werden übernommen
* Backups sind möglich
* Restore ist möglich
* Dokumentation für Self Hosting vorhanden

## Sprint-Abschluss

### ADR 011 – Rotation wird serverfähig
Darin sollte festgehalten werden:
* Warum SQLite als erste Datenbank gewählt wurde.
* Warum REST statt direkter DB-Zugriffe.
* Warum Cover als Dateien statt als BLOBs gespeichert werden.
* Warum Single User bewusst Teil der Produktphilosophie ist.

### Abschluss
* changelog
* roadmap
* version+
* git-commit


# Sprint 59 — Story-driven Insights
**Status:** Geplant
**Zielversion:** `v0.19.0-dev`

## Ziel
Rotation kann persönliche Albumgeschichten später vorsichtig in Insights einbeziehen.
Nicht als Statistik.
Sondern als sprachliche Beobachtung.

## Beispiele

Viele deiner wichtigsten Alben kamen über Empfehlungen in deine Sammlung.
Mehrere Klassiker begleiten dich seit deiner Studienzeit.
Einige archivierte Alben wirken eher wie Erinnerungsstücke als wie aktive Rotation.

## Nicht Bestandteil
* keine Diagramme
* keine Scores
* keine Auswertungspflicht
* keine Bewertung persönlicher Erinnerungen



---


# Sprint 60 - Search & Discovery

## Ziel
Große Bibliotheken besser erschließen.

## Themen
- Bibliothek durchsuchen
- intelligente Filter
- schnelle Navigation
- vorbereitete Smart Collections

---

# Sprint 61

## Platform Foundation

### Ziel

Vorbereitung einer nativen Anwendung.

### Themen

- PWA
- iOS
- Android
- Offline First
- Synchronisation vorbereiten

---

# Sprint 62

## Native Prototype

Erste lauffähige mobile Version.

---

# Phase VIII

## Musical Companion

Rotation entwickelt sich vom Werkzeug zum Begleiter.

---

# Sprint 63

## Weekly Reflection

Wöchentliche Rückblicke.

Nicht Statistiken.

Sondern Geschichten.

---

# Sprint 64

## Listening Patterns

Rotation erkennt langfristige Entwicklungen.

Beispiele

- Du hörst wieder mehr Jazz.

- Viele Alben wechseln gerade ihre Rolle.

- Deine Klassiker verändern sich kaum.

Keine Bewertung.

Nur Beobachtung.

---

# Sprint 65

## Explainability 2.0

Die Player-Rotation wird vollständig nachvollziehbar.

Der Nutzer versteht jederzeit:

- warum ein Album gewählt wurde

- welche Rolle es erfüllt

- welche Geschichte die Rotation erzählt

---

# Langfristige Vision

Rotation soll sich niemals wie eine Datenbank anfühlen.

Rotation soll sich niemals wie Spotify anfühlen.

Rotation soll sich niemals wie ein Statistiktool anfühlen.

Rotation soll sich anfühlen wie ein Gespräch über Musik.

Ein Album ist keine Datei.

Ein Album ist eine Geschichte.

Rotation hilft dabei,

diese Geschichten über viele Jahre bewusst zu begleiten.