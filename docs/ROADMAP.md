# Rotation Roadmap

> Rotation is not a tool for managing a music collection.
>
> Rotation accompanies the relationship between person and album.

Version: v0.21.x-dev

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

# Current Architecture

Rotation consists of two clearly separated layers.

## Library

The library describes the entire album collection.

Album roles document relationships.

The library has no target sizes.

It is not evaluated.

It serves as the basis for:

- Reflection
- Timeline
- Insights
- Player Rotation

---

## Player Rotation

The Player Rotation is a consciously curated selection.

It may be explained.

It may be reflected upon.

It may later be intelligently supported.

Recommendations refer exclusively to this layer.

---

# Next Development Phase

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

## Goal
Better access to large libraries.

## Topics
- Search library
- Intelligent filters
- Quick navigation
- Prepared Smart Collections

---

# Sprint 62

## Platform Foundation

### Goal

Preparation of a native application.

### Topics

- PWA
- iOS
- Android
- Offline First
- Prepare synchronization

---

# Sprint 63

## Native Prototype

First runnable mobile version.

---

# Phase IX

## Musical Companion

Rotation evolves from tool to companion.

---

# Sprint 64

## Weekly Reflection

Weekly reviews.

Not statistics.

But stories.

---

# Sprint 65

## Listening Patterns

Rotation recognizes long-term developments.

Examples

- You are listening to more jazz again.

- Many albums are currently changing their role.

- Your classics change hardly at all.

No evaluation.

Only observation.

---

# Sprint 66

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
