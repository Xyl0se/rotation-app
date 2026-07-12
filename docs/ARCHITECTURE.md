# Architecture

Features own no data.

Features transform data.

---

## Product and Domain Principle

Rotation deliberately distinguishes between **Library** and **Player Rotation**.

The library documents the personal relationship between person and album.

It is **not evaluated**.

Album roles have **no target sizes**, **no optimal distribution**, and **no recommended balance**.

The Player Rotation is a consciously curated selection from the library.

Reflection, Explainability, and future recommendations refer exclusively to this active Player Rotation — never to the size of individual roles within the library.

---

## Technical Framework

- React 19
- TypeScript
- Vite
- Browser `localStorage`
- IndexedDB (Cover Cache, Custom Covers)
- External metadata: MusicBrainz and Cover Art Archive

---

## Domain Model

Rotation knows two clearly separated layers.

### Library

The library describes the complete album collection.

Album roles document the current relationship between user and album.

There are no target sizes or optimal distributions.

The library serves as the basis for:

- Reflection
- Timeline
- Insights
- Player Rotation

It is not evaluated itself.

### Player Rotation

The Player Rotation is a consciously curated selection from the library.

This selection may:

- be explained
- be reflected upon
- later be intelligently supported

Recommendations refer exclusively to this layer.

---

## Deployment Architecture

Rotation runs as a multi-service Docker stack:

```
┌─────────────┐
│   Browser   │
│  (Client)   │
└──────┬──────┘
       │
┌──────┴──────┐
│   Caddy     │ ← Reverse Proxy, SPA host
│  (:3000)    │
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

### Data Flow

**Client-side (Browser):**

`App.tsx` decides whether to show the welcome page or the HomePage.

`HomePage.tsx` is the central container. It composes features and passes data and callbacks through props.

The library logic lives in `useLibrary.ts` (ADR 004). The hook encapsulates:

- Loading, saving, and normalizing albums from `localStorage`
- CRUD operations (`addAlbum`, `updateAlbum`, `deleteAlbum`)
- Cover override management
- Focus Album management
- Role updates

The listening history lives in `useListenEvents.ts`.

The RotationPlan lives in `useRotationPlan.ts`.

**Server-side (API):**

The API handles file-system operations that the browser cannot perform:

- `/bindings` — Album File Binding management (read-only safe)
- `/scan` — Directory scanning and fuzzy matching (write-protected)
- `/exports` — Export preview, staging, and apply (write-protected)
- `/config` — Runtime configuration (read-only)
- `/health` — Healthcheck

All write operations (`POST/PUT/DELETE`) on scan and exports require the `X-Write-Token` header.

### Album File Binding Domain

A new server-side domain connects Rotation albums to the file system:

- `Binding` — an association between an `albumId` and a `relativePath` within the music library
- `BindingState` — `proposed` | `confirmed` | `missing`
- `ScanService` — discovers potential bindings by matching album metadata against directory names
- `ExportService` — validates bindings, previews exports, stages file copies, and atomically applies exports

Bindings are stored in SQLite and survive container restarts.

---

## Album Model

An album currently consists of:

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

`category` is set by Album Coach, Reflection, or Archive Workflow.

`roleHistory` consciously and traceably documents the development of this relationship.

The current role describes exclusively the relationship between person and album.

It does **not** serve to evaluate the collection.

`listenCount` and `lastListened` are legacy fields for compatibility.

The actual listening history lives in `listenEvents`.

`coverOverride` is a discriminated union:

- `type: "url"`
- `type: "custom"`

`coverUrl` remains the original from MusicBrainz / Cover Art Archive.

`coverOverride` deliberately overrides this.

The actual Player Rotation is stored as `RotationPlan`.

A RotationPlan describes a concrete selection of multiple albums including the reason for selection.

---

## Feature Slice

- discover-album
- album-coach
- archive
- dashboard (Reflection, Insights, and neutral role overview)
- library
- library dialogs
- focus-album
- player-rotation
- insights
- timeline
- reflection
- role-explorer
- ui

The `rotation-dashboard` area serves exclusively as the entry point for Reflection, Insights, and Explainability.

It does not evaluate the library.

---

## Domain Slice

### Roles

`domain/roles.ts`

Canonical album roles.

---

### Album

`domain/album/*`

Coach questions

Coach evaluation

Role determination

---

### Archive

`domain/archive/*`

Archive protection

Rediscovery

Archive questions

---

### Dashboard

`domain/dashboard/*`

Composition of dashboard building blocks.

Linguistic summaries.

No evaluation logic.

---

### Insights

`domain/insights/*`

Linguistic observations about collection and listening behavior.

---

### Timeline

`domain/timeline/*`

Derivation of documented album history.

---

### Rotation

`domain/rotation/*`

Domain logic around the active Player Rotation.

This area describes the selection of a rotation.

It explicitly does not evaluate the library.

Long term, Explainability of the rotation emerges here.

---

### RotationPlan

`domain/rotation-plan/*`

Generator and target model of the Player Rotation.

---

### Reflection

`domain/reflection/*`

Rules and texts for conscious reclassifications of individual albums.

---

### Library Views

`domain/library-views/*`

Grouping logic for perspectives.

---

Domain code remains completely component-free and separately testable.

---

## Service Slice

React components communicate exclusively with `searchAlbum`.

This service encapsulates:

- MusicBrainz
- Cover Art Archive

External APIs remain fully outside the features.

---

## Cover Management

Album covers are treated as an independent resource.

`AlbumCover` is the central component for all cover renderings.

### Cache

- IndexedDB
- Blob Cache
- Offline-capable
- Network reduction

### Custom Covers

Separate store:

- saveCustomCover
- getCustomCover
- removeCustomCover

### Priority

1. coverOverride URL
2. coverOverride Custom
3. coverUrl
4. Placeholder

---

## Migration Registry

Migrations are registered declaratively.

Properties:

- versioned
- incremental
- idempotent
- testable

New migration:

1. Write function
2. Register
3. Increase SCHEMA_VERSION
4. Add tests

---

## Data Integrity Layer

Three lines of defense:

### Adapter

Transport

Quota Errors

StorageQuotaError

### Repository

Type Guards

Defensive Loading

Normalization

### Normalization

Legacy fields

Migration

Cleanup

---

## Architecture Principles

The architecture follows some fundamental rules.

### Library documents.

Does not evaluate.

### Roles describe relationships.

Not categories.

Not quotas.

### Dashboard observes.

Does not optimize.

### Reflection accompanies.

Does not correct.

### Explainability explains decisions.

Not rules.

---

## Known Architecture Debt

- `listenCount` and `lastListened` are legacy fields and should long-term be fully derived from `listenEvents`.
- `StorageQuotaError` is currently not communicated to the UI.
- Parts of the Dashboard domain still rely on historical role balance. This logic will be completely removed in a later sprint and replaced by Explainability of the Player Rotation.
