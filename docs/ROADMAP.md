# Rotation Roadmap

> Rotation is not a tool for managing a music collection.
>
> Rotation accompanies the relationship between person and album.

Version: v0.25.x-dev

---

# ⚠️ Current Focus: Stabilization

**New features are frozen until Sprint 75 is completed.**

Rotation has undergone a massive architectural expansion (Sprints 58–70): server persistence, Docker deployment, album file binding, and the export engine. The system is functional but not yet battle-tested under real-world NAS conditions.

The next sprints are dedicated exclusively to **hardening, bugfixing, and operational reliability**. No new product features will be added.

---

# Product Guideline

Rotation has pursued a clear product philosophy since version 0.16.

The library documents relationships.

It is not evaluated.

Album roles have no target sizes.

There is no optimal role distribution.

There is no "perfect collection".

The Player Rotation is a consciously curated selection from the library.

Reflection supports decisions.

Explainability explains decisions.

The Dashboard creates attention.

Not optimization.

All future developments are oriented toward these principles.

---

# Current Product State

Rotation today has the following core features.

## Collection

- Album discovery
- MusicBrainz lookup
- Cover Art Archive
- Cover override
- Album Coach
- Role model
- Role History
- Timeline
- Listening History
- Archive
- Rediscovery

## Library

- Editor
- Role Explorer
- Library Perspectives
- Search prepared
- Cover Cache
- Persistence

## Rotation

- Focus Album
- Player Rotation
- Rotation Review
- RotationPlan

## Dashboard

- Reflection
- Insights
- Role overview

## Infrastructure

- Repository Pattern
- Storage Adapter
- Migration Registry
- IndexedDB
- Persistence
- Defensive Loading
- Test coverage >200 tests

---

# Completed Development Phases

## Phase I

Foundation

Basics of the React application.

---

## Phase II

Discover Experience

Album Discovery

MusicBrainz

Album Coach

Metadata

---

## Phase III

Living Library

Role History

Timeline

Reflection

Archive

Listening History

---

## Phase IV

Curated Rotation

Player Rotation

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

## Phase VII

Self-Hosting & Internationalization

Deployment Foundation

GitHub Container Registry

Internationalization (i18n)

Documentation Sprint

---

## Phase VIII

From Dashboard to Companion

Rotation evolves from a collection toward a musical companion.

---

# Sprint 57 — Classic & Archive Logic Rework

**Status:** Completed

**Target version:** `v0.18.0-dev`

## Result

- New Album Coach: deterministic tree with 8 possible questions, no mandatory question chain anymore
- Classic has priority over comfort-food and growing (formative effect as primary signal)
- Archive protection: `hasBiographicPlace` instead of `wouldRecommend` — personal classics remain protected
- Partial answers: `AlbumCoachAnswers = Partial<AlbumCoachAnswerValues>`
- Role definitions refined: `classic` = permanently formative, `admire` = musically valued without closeness, `archive` = may rest
- Details in [CHANGELOG](CHANGELOG.md)

---

# Sprint 58 — Self-Hosted Rotation

**Status:** Completed

**Target version:** `v0.19.x-dev` → `v0.20.x-dev`

## Goal

Rotation is operated independently from the local development machine for the first time.
The application can run on a server and be used by multiple devices on the home network or internet.
All product principles are preserved.
The existing library can be fully adopted.

## 58A — Deployment Foundation

### Goal

Rotation is built production-ready.

No longer just npm run dev.

### Topics

- Production Build
- Dockerfile
- Docker Compose
- nginx or Caddy as webserver
- Environment configuration
- Healthcheck
- Persistent data directory prepared

### Result
Rotation runs via docker compose up in the browser.
Still completely local.
No database.
No API.

### Not included
- User management
- Database
- Migration


## 58B — Server Persistence

### Goal
Browser persistence is supplemented by real server persistence.
The architecture remains repository-based.

### Architecture

#### Today:
React
↓
StorageAdapter
↓
localStorage

#### New:
React
↓
Repository
↓
REST API
↓
Persistence Service
↓
SQLite

SQLite is the perfect first step.

Why?
- No server installation
- Trivial backups
- Docker-friendly
- Proven millions of times over
- Later easily migratable to PostgreSQL

### Topics

#### Backend
- Small Node backend
- REST API
- Repository Layer
- SQLite

#### Frontend
- ApiStorageAdapter
- Reuse existing Repository Interfaces

### Result
The application works completely against a database.

### Not included
No users yet.


## 58C — Data Migration

### Goal
Adopt existing local libraries.

### Import Assistant
On first start Rotation detects:
Local data exists.
The user gets: Would you like to adopt your library?

Imported:
- Albums
- Stories
- Role History
- Listening History
- Rotation Plans
- Reflection
- Cover Overrides

Afterward local data is optionally deleted.

### Cover Migration
Especially important.
Today covers live in
- localStorage
- IndexedDB
Later
SQLite + Filesystem
or
SQLite + Blob Storage
I would not store in the database.

Instead:
/covers/
album-id.webp
The DB only contains the path.

Result
Existing installations can fully migrate.

## 58D — Home Server Edition

### Goal
Rotation feels like a "real" application.

### Topics
- Automatic backups -> backup/rotation-2026-08-31.sqlite
- Export -> rotation-backup.zip
- Import -> rotation-backup.zip
- Healthcheck -> /health
- Docker Volumes
- Configuration
- .env

### Result
Rotation can run permanently on a NAS,
mini PC,
Raspberry Pi
or home server.

## Architecture Goal

After Sprint 58 Rotation looks approximately like this:

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
- Rotation runs completely in Docker
- Application is usable without development server
- SQLite replaces browser persistence
- Repository Pattern is preserved
- Existing local library can be fully migrated
- Covers are adopted
- Backups are possible
- Restore is possible
- Documentation for Self Hosting available

## Sprint Conclusion

### ADR 011 — Rotation becomes server-capable
This should document:
- Why SQLite was chosen as the first database.
- Why REST instead of direct DB access.
- Why covers are stored as files instead of BLOBs.
- Why Single User is consciously part of the product philosophy.

### Conclusion
- changelog
- roadmap
- version+
- git-commit


# Sprint 59 — Story-driven Insights
**Status:** Completed
**Target version:** `v0.19.0-dev`

## Goal
Rotation can carefully incorporate personal album stories into Insights later.
Not as statistics.
But as linguistic observation.

## Examples

Many of your most important albums came into your collection through recommendations.
Several classics have accompanied you since your student days.
Some archived albums feel more like mementos than active rotation.

## Not included
- No diagrams
- No scores
- No evaluation obligation
- No evaluation of personal memories



---


# Sprint 60 — Internationalization (i18n) & Documentation Sprint
**Status:** Completed
**Target version:** `v0.21.0-dev`

## Goal
Rotation becomes accessible in English and German.
All user-facing UI strings are internationalized via a type-safe i18n system.
All product documentation is translated to English.
Legacy German strings in the domain layer are identified as a known follow-up item.

## Result
- Complete i18n system: DE/EN locale files with full type safety.
- React Context + Hook: `I18nContext` provides `locale`, `setLocale`, and `t()`.
- Language switcher: Globe icon in the header toolbar.
- All UI components internationalized.
- Persistent language preference in `localStorage`.
- All `/docs` translated to English.
- Domain strings (coach questions, archive questions, role explanations) remain in German as a known follow-up.
- No new dependencies.

---

# Sprint 61 - Search & Discovery

**Status:** Backlog — frozen until stabilization is complete.

## Goal
Better access to large libraries.

## Topics
- Search library
- Intelligent filters
- Quick navigation
- Prepared Smart Collections

---

# Sprint 62 — Album File Binding & Rotation Export

**Status:** Completed

**Target version:** `v0.22.0-dev`

## Goal

Rotation connects to the actual music collection for the first time.
An accepted Player Rotation can be exported as a physical folder of album directories.
This export is consumed by Syncthing (or any sync tool) to populate an MP3 player.

Rotation does NOT become a music player.
Rotation does NOT modify the original library.

## Architecture

### New Domain: Album File Binding

A new `bindings` table maps album IDs to relative paths in the music library.
Paths are stored relative to a configured root (`/music`).
Bindings have states: `unbound`, `proposed`, `confirmed`, `missing`.

### New Domain: Export Engine

A three-phase export pipeline ensures safety and reversibility:

1. **Preview** — resolves bindings, calculates size, reports missing/unconfirmed
2. **Stage** — copies albums to a staging directory with a manifest
3. **Apply** — atomically swaps staging to the active export directory, archiving the previous export

All file operations are restricted to configured root directories via `PathGuard`.
The original music library is **read-only**.

### New Infrastructure

- `server/src/domain/export/` — export engine, manifest, file copier
- `server/src/infrastructure/filesystem/pathGuard.ts` — safe path resolution
- `server/src/routes/exports.ts` — REST endpoints for export lifecycle
- `src/pages/ExportPage.tsx` — frontend UI for Preview → Stage → Apply
- `src/hooks/useExport.ts` — state machine for export flow

### Security Model

- All paths are resolved relative to configured root directories
- No absolute paths from the frontend are accepted
- Original library is read-only (mounted read-only in Docker)
- Workspace (staging, exports, archive) is writeable
- Every export is archivable before replacement

## Result

- `/bindings` page — scan, propose, confirm album→folder bindings
- `/export` page — preview rotation, stage, apply, with progress feedback
- Export produces a folder structure ready for device sync
- Previous exports are archived with timestamps
- Full test coverage: 275+ tests

### Not included
- Automatic file watching / live sync
- Cover art export (files are copied as-is)
- Format conversion
- Syncthing integration (Rotation only produces the export; Syncthing handles sync)

---

# Sprint 67 — Production Deployment Foundation

**Status:** Completed

**Target version:** `v0.23.0-dev`

## Goal

Rotation läuft als vollständiger Stack (Frontend + API) produktionsreif auf der Synology.
Export-Engine und Bindings sind erst dann wirklich nutzbar.

## Result

- **Multi-Service Docker Compose** (`docker-compose.prod.yml`): `rotation-web` (Caddy + SPA) + `rotation-api` (Node + Express + SQLite)
- **Caddy als Reverse Proxy**: `/` → Frontend, `/api/*` → `rotation-api:3001`, `/health` → API-Healthcheck
- **Unprivilegierter Container-User**: `USER node` (UID 1001) in beiden Dockerfiles
- **Volume-Mounts**: `/music:ro` (Originalbibliothek), `/rotation-data:rw` (SQLite, Exports, Staging, Archive)
- **GitHub Actions**: Workflow `docker-publish-api.yml` baut und pusht `ghcr.io/xyl0se/rotation-api:latest`
- **CORS**: Server akzeptiert Browser-Requests über `cors({ origin: true })`
- **`SELFHOST.md`**: Vollständige Synology-Setup-Anleitung mit Permissions, Backup, Troubleshooting, Syncthing-Integration

## Architecture

```
┌─────────────┐
│   Browser   │
│  (Client)   │
└──────┬──────┘
       │
┌──────┴──────┐
│   Caddy     │ ← Reverse Proxy, SPA host
│  (:3000)    │
├─────────────┤
│  / → SPA    │
│  /api/* →   │ → rotation-api:3001
│  /health    │
└──────┬──────┘
       │
┌──────┴──────┐
│ rotation-api│ ← Node + Express + SQLite
│  (:3001)    │
├─────────────┤
│ /music:ro   │ ← Original library (read-only)
│ /rotation-  │ ← SQLite, exports, staging
│   data:rw   │
└─────────────┘
```

## Definition of Done

- [x] `docker compose up -d` startet vollständigen Stack (Web + API)
- [x] Frontend kommuniziert über `/api` mit Backend (Same Origin)
- [x] `/music` ist gemountet und vom Backend lesbar
- [x] `/rotation-data` ist beschreibbar
- [x] Export wird nach `/rotation-data/exports/current-rotation` geschrieben
- [x] Unprivilegierter User läuft im Container
- [x] `SELFHOST.md` dokumentiert Synology-Setup Schritt für Schritt
- [x] GitHub Actions baut und pusht beide Images

---

# Sprint 68A — Binding Verification, Export Preview & Apply

**Status:** Completed

**Target version:** `v0.24.0-dev`

## Goal

Bindings sind verlässlich — auch nach NAS-Neustarts, Umbenennungen oder verschobenen Ordnern.
Export-Preview und Apply sind aus dem Frontend heraus bedienbar.

## Result

- **Binding-Verifikation**: `ScanService` prüft bei jedem Scan, ob gebundene Ordner noch existieren. `missing` Status wird gesetzt.
- **Compilations-Heuristik**: Ordner mit "VA", "Various", "Compilations", "Soundtrack" werden als Compilation markiert und nicht automatisch zugeordnet.
- **Mehrfache Treffer**: Wenn `album.title` mehrfach vorkommt, wird kein automatischer Vorschlag gemacht — UI zeigt alle Kandidaten zur expliziten Auswahl.
- **Export Preview & Stage & Apply**: Vollständiger 3-Phasen-Export-Flow über `ExportPage.tsx` mit `useExport.ts` Hook.
- **i18n**: Vollständige Übersetzungen für `nav`, `bindings`, `exportPage` in EN/DE.
- **CORS**: Server akzeptiert Browser-Requests für Frontend-Integration.
- **Navigation**: Header zeigt "Bindings" und "Export" Links.

## Definition of Done

- [x] `missing` Status funktioniert und wird im UI angezeigt
- [x] Compilations werden erkannt und nicht automatisch zugeordnet
- [x] Mehrfache Treffer werden aufgelistet statt automatisch gewählt
- [x] Verifikation wird bei jedem Scan automatisch durchgeführt
- [x] Export-Preview, Stage und Apply sind aus dem Frontend bedienbar
- [x] Alle neuen UI-Strings sind internationalisiert
- [x] Build und Tests grün (Frontend 275, Server 31)

---

# Sprint 68B — Fuzzy Matching (optional / backlog)

**Status:** Backlog

**Target version:** `v0.25.0-dev` (optional)

## Goal

Bessere Vorschläge durch Fuzzy-Matching, aber niemals automatische Bestätigung.

## Topics

- Levenshtein-Distanz oder ähnlicher Algorithmus
- Ranking von Kandidaten
- Tag-Metadaten als zusätzliche Signalquelle
- Konfigurierbare Schwelle (z.B. 80% Match)

## Definition of Done

- [ ] Fuzzy-Vorschläge werden im UI angezeigt
- [ ] Ranking hilft bei der Auswahl
- [ ] Automatische Bestätigung bleibt ausgeschaltet
- [ ] User kann Fuzzy-Matching deaktivieren

---

# Sprint 69A — Export Preview & Staging

**Status:** Completed (Teil von Sprint 62)

**Target version:** `v0.22.0-dev`

## Result

- Preview prüft bestätigte Bindings, berechnet Größe und Dateianzahl
- Staging kopiert sicher nach `.staging/<exportId>/`
- Manifest wird geschrieben
- Alles bereits in Sprint 62 implementiert

---

# Sprint 69B — Export Apply Hardening

**Status:** Completed

**Target version:** `v0.24.0-dev`

## Goal

Der Apply-Schritt ist robust gegen Race Conditions, Abstürze und parallele Exporte.

## Result

- **Export Lock**: SQLite-basierte Mutual Exclusion (`export_locks` Tabelle). Acquire mit Timeout (15 Min), steal-expired, idempotent für selben Export.
- **Export Diff Engine**: `calculateExportDiffForPreview()` berechnet `added`/`removed`/`unchanged` gegen aktuelles `current-rotation`. Endpoint `POST /exports/diff`.
- **Apply mit Diff**: `applyExport` gibt vollständiges Diff zurück. Archivierung atomar via `renameSync`.
- **Keep-Removed**: `applyExport` akzeptiert `keepRemoved` Flag (vorbereitet für UI).

## Definition of Done

- [x] Parallele Exports werden verhindert
- [x] Abgestürzte Exports werden nach Timeout freigegeben
- [x] Diff zeigt vor Apply was sich ändert
- [x] Alte Alben können optional behalten werden

---

# Sprint 69C — Crash Recovery & Rollback

**Status:** Completed

**Target version:** `v0.24.0-dev`

## Goal

Bei Absturz oder Fehler ist der Zustand wiederherstellbar.

## Result

- **Crash Recovery**: `detectCrashedExports()` erkennt "staged" Operationen beim Server-Start, führt Rollback durch, räumt verwaiste Staging-Verzeichnisse auf.
- **Manifest-Archivierung**: Jeder Apply archiviert vorherigen Zustand mit Timestamp unter `archive/YYYYMMDD-HHMMSS/`.
- **Tests**: `exportLockRepository.test.ts` (7 Tests), `exportDiff.test.ts` (4 Tests). Alle 42 Server-Tests grün.

## Was aus dem ursprünglichen Sprint 69C fehlt (Backlog)

- Tests mit simulierten Abbrüchen (Copy nach 50% killen)
- Frontend-Button für manuelles Rollback
- Alte Archive > 30 Tage automatisch aufräumen

## Definition of Done

- [x] Server-Start erkennt unvollständige Exporte
- [x] Verwaiste Staging-Ordner werden aufgeräumt
- [ ] Crash-Szenarien sind durch Tests abgedeckt (Backlog)
- [ ] Rollback ist aus dem Frontend auslösbar (Backlog)

---

# Sprint 70 — Operations & Deployment Polish

**Status:** Completed

**Target version:** `v0.25.0-dev`

## Goal

Rotation läuft vollständig produktionsreif auf der Synology.
Der Export-Ordner ist für Syncthing bereit. GitHub Actions baut beide Images.
Die Dokumentation deckt den gesamten Betriebsalltag ab.

## Scope

Syncthing läuft bereits auf der Synology und wird **nicht** von Rotation verwaltet.
Rotation stellt nur den Export-Ordner bereit. Die Syncthing-Einrichtung
(Send-only-Folder, Gerätepaarung, Rescan-Intervall) obliegt dem Nutzer.

## Topics

### Syncthing-Dokumentation

- Empfohlener Ordner-Pfad: `/volume1/docker/rotation/exports/current-rotation`
- Empfohlene Einstellungen (Send-only, Rescan-Intervall)
- Löschverhalten dokumentieren: Was passiert, wenn ein Album aus der Rotation fällt?

### CI/CD

- GitHub Actions baut beide Images (Frontend + API)
- `ghcr.io/xyl0se/rotation-web:latest`
- `ghcr.io/xyl0se/rotation-api:latest`
- Version-Tags synchronisieren
- Automatischer Push zu GHCR

### Update-Prozess

- `docker compose pull && docker compose up -d`
- Datenbank-Migrationen automatisch
- Kein Datenverlust bei Updates

### Betriebshandbuch

- Log-Monitoring (`docker compose logs -f`)
- Speicherplatz-Überwachung (Export-Ordner, Archive, Staging)
- Backup-Schedule
- Fehlerbehebung

## Definition of Done

- [x] Syncthing-Integration ist in `SELFHOST.md` dokumentiert
- [x] Löschverhalten ist dokumentiert
- [x] GitHub Actions baut beide Images automatisch
- [x] Update-Prozess ist dokumentiert
- [x] Betriebshandbuch existiert

---

# Phase VIIIb — Stabilization & Hardening (Active)

> **No new features. Only robustness, bugfixing, and operational reliability.**

The system has been deployed but needs to prove itself under real-world conditions on a Synology NAS. This phase is about making Rotation trustworthy before any new product features are added.

---

## Sprint 70A — System Diagnostics Panel

**Status:** Completed

**Target version:** `v0.25.1-dev`

### Goal

Users can see the health of the Rotation system at a glance from the frontend. No more guessing whether the NAS mounts, database, or bindings are working.

### Architecture Changes

- New `/diagnostics` REST endpoint on the API
- Frontend `DiagnosticsService` + `DiagnosticsPanel` component
- i18n keys for diagnostics (EN/DE)

### Affected Components

- `server/src/routes/diagnostics.ts` — system health endpoint
- `server/src/index.ts` — route registration
- `src/services/api/diagnosticsService.ts` — API client
- `src/components/features/diagnostics/DiagnosticsPanel.tsx` — collapsible health panel
- `src/pages/BindingsPage.tsx` — panel embedded at top
- `src/i18n/locales/{en,de}.ts` — diagnostics translations
- `src/styles/diagnostics.css` — panel styling

### Risks

- Diagnostics endpoint could leak internal paths if not carefully designed
- False negatives if Docker volumes are mounted but empty

### Definition of Done

- [x] `/diagnostics` returns: DB status, `/music` readability, `/rotation-data` writability, Syncthing folder status, binding counts, last scan timestamp
- [x] Frontend panel shows summary (OK / warning / error) with expandable details
- [x] Manual refresh button works
- [x] All strings internationalized
- [x] Panel embedded on Bindings and Export pages
- [x] Build and tests green

---

## Sprint 71 — Binding & Scan Robustness

**Status:** Planned

**Target version:** `v0.25.2-dev`

### Goal

Bindings and scan are reliable under real-world conditions.

### Architecture Changes

None. Bugfixes and edge-case handling only.

### Affected Components

- `ScanService` — empty directories, special characters in paths, permission denied
- `BindingRepository` — race conditions during parallel scans
- `BindingsPage.tsx` — UI feedback for long scans (>30s)

### Risks

- NAS filesystem behavior (NFS, case-sensitivity) differs from local dev setup
- Large music libraries may cause timeouts

### Definition of Done

- [ ] Scan completes even when `/music` is temporarily unreachable
- [ ] `missing` bindings are reliably detected
- [ ] No unhandled rejections in the scan flow
- [ ] UI shows scan progress instead of only a spinner
- [ ] Special characters in folder names (umlauts, spaces, brackets) are handled
- [ ] Scan is idempotent: running twice produces the same result

---

## Sprint 72 — Export Safety & Edge Cases

**Status:** Planned

**Target version:** `v0.25.2-dev`

### Goal

The export flow is safe under all conditions.

### Architecture Changes

None.

### Affected Components

- `ExportService` — what happens when an album is deleted during export?
- `ExportLock` — what happens on Docker restart during Apply?
- `PathGuard` — symlink attacks, path traversal
- `ExportPage.tsx` — better error states and recovery UI

### Risks

- Data loss in the export folder (Syncthing might sync during Apply)
- Partial copy leaves staging in inconsistent state

### Definition of Done

- [ ] Export can continue when an album is missing (skip + report)
- [ ] Apply is atomic even on `kill -9` of the container
- [ ] PathGuard rejects any path manipulation attempts
- [ ] Archives older than 30 days are automatically cleaned up
- [ ] Staging directories are cleaned up after failed exports
- [ ] Export size calculation handles unreadable files gracefully

---

## Sprint 73 — Frontend Resilience

**Status:** Planned

**Target version:** `v0.25.3-dev`

### Goal

The frontend survives API outages, timeouts, and network issues.

### Architecture Changes

None.

### Affected Components

- `ApiStorageAdapter` — retry logic, exponential backoff
- `useExport.ts` — state machine must not end in dead ends
- All pages — loading and error states audited
- `App.tsx` — global error boundary

### Risks

- User confusion from unclear error messages
- Retry storms overwhelming a recovering API

### Definition of Done

- [ ] API timeout after 10s with retry (max 3x)
- [ ] Exponential backoff between retries
- [ ] Offline indicator in header
- [ ] No infinite loading spinners
- [ ] Every API call has an error handler
- [ ] Global error boundary catches React crashes
- [ ] Toast/notification system for async operation results

---

## Sprint 74 — Data Integrity & Backup

**Status:** Planned

**Target version:** `v0.25.4-dev`

### Goal

Data is safe even in catastrophic failures.

### Architecture Changes

- Automatic SQLite backup (e.g., daily to `/rotation-data/backups/`)
- Backup rotation (keep only last 7 days)

### Affected Components

- `initDatabase` — WAL checkpoint before backup
- New `backupService.ts`
- Docker volume for backups (optional)
- `SELFHOST.md` — backup and restore procedures

### Risks

- Backup during running export = inconsistent DB
- Backup file corruption if disk is full

### Definition of Done

- [ ] Daily automatic backup
- [ ] Backup during export is prevented (lock)
- [ ] Restore from backup is documented and tested
- [ ] DB migrations are reversibly documented
- [ ] Backup rotation: only 7 most recent backups kept
- [ ] Backup integrity is verified (SQLite PRAGMA integrity_check)

---

## Sprint 75 — Observability & Operations

**Status:** Planned

**Target version:** `v0.25.5-dev`

### Goal

You can see what Rotation is doing without looking at the code.

### Architecture Changes

- Structured logging (not just `console.log`)
- Healthcheck returns more than just `200 OK`
- Optional: metrics (export size, scan duration)

### Affected Components

- `logger.ts` — consistent log format
- `health.ts` — DB connection, volume state, last scan
- `SELFHOST.md` — troubleshooting extension
- Docker Compose — log rotation configuration

### Definition of Done

- [ ] Every important operation (scan, export, apply) is logged
- [ ] Healthcheck shows: DB ok, /music readable, /rotation-data writable
- [ ] Logs are readable via `docker compose logs -f` and meaningful
- [ ] `SELFHOST.md` has a troubleshooting section
- [ ] Log rotation is configured (no unbounded log growth)
- [ ] Failed operations are logged with enough context to debug

---

# Phase IX — Search & Discovery (Backlog)

**Status:** Frozen until Sprint 75 is completed.

Sprint 61 and 68B (Fuzzy Matching) will be picked up here when stabilization is done.

## Topics

- Search library
- Intelligent filters
- Quick navigation
- Prepared Smart Collections
- Fuzzy Matching for album→folder binding proposals

---

# Phase X — Platform & Companion (Backlog)

**Status:** No active development. Future vision only.

## Platform Foundation

Preparation of a native application.

- PWA
- iOS
- Android
- Offline First
- Prepare synchronization

## Native Prototype

First runnable mobile version.

## Musical Companion

Rotation evolves from tool to companion.

## Weekly Reflection

Weekly reviews.

Not statistics.

But stories.

## Listening Patterns

Rotation recognizes long-term developments.

Examples:

- You are listening to more jazz again.
- Many albums are currently changing their role.
- Your classics change hardly at all.

No evaluation. Only observation.

## Explainability 2.0

The Player Rotation becomes fully traceable.

The user understands at all times:

- why an album was chosen
- which role it fulfills there
- which story the rotation tells

---

# Long-term Vision

Rotation should never feel like a database.

Rotation should never feel like Spotify.

Rotation should never feel like a statistics tool.

Rotation should feel like a conversation about music.

An album is not a file.

An album is a story.

Rotation helps

consciously accompany these stories over many years.
