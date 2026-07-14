# Sprint 75.2 — Library-Bindings Enabler (Delta Patch)

**Status:** Done ✅ — must complete before Sprint 76.

**Target version:** `v0.25.7-dev`

---

## Goal

Sprint 75.1 moved the album library to the server. Sprint 76 requires Library and Bindings to visibly reference the same physical album. Sprint 75.2 is a **delta patch** that closes the remaining gaps between the two tables (`albums` and `bindings`) so Sprint 76 can focus purely on UI/UX integration.

---

## Topics

### 1. Server: JOIN-Ready Binding Repository

The `bindingRepository` currently only queries the `bindings` table. Sprint 76 needs correlated album data.

- Add `findOrphans()` — bindings whose `album_id` does **not** exist in `albums`
- Add `findWithAlbumData()` — bindings with LEFT JOIN on `albums` to fetch `title` and `artist`
- Add index on `bindings.album_id` for fast JOINs and foreign-key-like lookups

### 2. Server: Extended BindingDTO & Orphan Endpoint

The current `BindingDTO` only knows about the binding itself. Sprint 76 needs visibility into the library state.

Extend `BindingDTO` with:
- `libraryExists: boolean`
- `albumTitle?: string`
- `albumArtist?: string`

New endpoint:
- `GET /bindings/orphans` — returns all bindings without a matching library album

Update existing endpoints:
- `GET /bindings` and `GET /bindings?albumId=...` include the new DTO fields

### 3. Client: Updated BindingsService Types

`src/services/api/bindingsService.ts` must reflect the server changes:

- Extend `Binding` interface with `libraryExists`, `albumTitle?`, `albumArtist?`
- Add `fetchOrphans(): Promise<BindingsListResponse>`

### 4. Frontend Data Layer: Correlation Hooks

Before Sprint 76 builds UI, the data layer must be ready:

- `useBindings()` or similar: loads bindings and correlates them with library albums
- Helper: `isAlbumBound(albumId)` — checks if a given album has a confirmed binding
- Helper: `getBindingForAlbum(albumId)` — returns the binding record for an album (if any)

### 5. I18n Preparation

Sprint 76 will need new UI strings. Sprint 75.2 adds the keys so translators can work in parallel:

- `bindings.orphanBadge` — "Not in Library"
- `bindings.albumPreview` — "{title} by {artist}"
- `coach.orphanPrompt.title` — "This album is not in your Library yet"
- `coach.orphanPrompt.description` — "Would you like to capture it?"
- `coach.orphanPrompt.dismiss` — "Not now"
- `coach.orphanPrompt.capture` — "Capture album"

---

## Architecture Changes

- **Changed Server Components:**
  - `server/src/infrastructure/persistence/sqlite/bindingRepository.ts` — `findOrphans()`, `findWithAlbumData()`, index on `album_id`
  - `server/src/routes/bindings.ts` — extended DTO, `GET /bindings/orphans`
- **Changed Client Components:**
  - `src/services/api/bindingsService.ts` — updated types and new method
  - `src/i18n/locales/{en,de}.ts` — new keys
- **New Client Components:**
  - `src/hooks/useBindings.ts` — correlation hook (optional; may also live inline in Sprint 76)

---

## Affected Components

| Component | Change |
|---|---|
| `server/src/infrastructure/persistence/sqlite/bindingRepository.ts` | JOIN queries, orphan lookup, index |
| `server/src/routes/bindings.ts` | Extended DTO, `/orphans` endpoint |
| `src/services/api/bindingsService.ts` | Updated `Binding` type, `fetchOrphans()` |
| `src/i18n/locales/en.ts` | New keys |
| `src/i18n/locales/de.ts` | New keys |

---

## Data Flow after Sprint 75.2

```
┌─────────────────────────────────────────┐
│           SQLite Database               │
├─────────────────────────────────────────┤
│  albums          │   bindings           │
│  ─────────────   │   ─────────────      │
│  id (PK)         │   album_id (FK-like) │
│  title           │   relative_path      │
│  artist          │   state              │
│  ...             │   ...                │
└─────────────────────────────────────────┘
                   │
                   ▼ LEFT JOIN
         ┌─────────────────┐
         │  findWithAlbum  │ → libraryExists, albumTitle, albumArtist
         │  findOrphans    │ → bindings without albums row
         └─────────────────┘
```

---

## Risks

| Risk | Mitigation |
|---|---|
| JOIN performance on large libraries | Index on `bindings.album_id`; SQLite WAL mode already active |
| Null album data in DTO | Type-safe optional fields (`albumTitle?`); frontend handles gracefully |
| Breaking existing binding API | New fields are additive only; no existing fields removed |

---

## Definition of Done

- [ ] `bindingRepository` has `findOrphans()` and `findWithAlbumData()`
- [ ] `GET /bindings/orphans` returns orphaned bindings
- [ ] All binding endpoints return extended DTO with `libraryExists`, `albumTitle?`, `albumArtist?`
- [ ] Client `Binding` type matches server DTO
- [ ] `fetchOrphans()` available in `bindingsService.ts`
- [ ] I18n keys added in EN and DE
- [ ] No regression in existing binding tests or scan/export flow

---

## Enabler for Sprint 76

After completing 75.2, Sprint 76 is a pure UI/UX sprint:

- `AlbumCard` checks `libraryExists` to show a linked-folder indicator
- `BindingsPage` calls `fetchOrphans()` to highlight missing albums
- Album Coach receives orphan data and offers the capture flow
- No further backend or data-layer changes required

