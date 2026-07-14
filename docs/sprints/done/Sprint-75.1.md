# Sprint 75.1 — Server-Side Library & Cover Storage

**Status:** Done ✅ — completed for Sprint 76.

**Target version:** `v0.25.6-dev`

---

## Goal

The album library and album covers move from browser `localStorage` to the server. The server becomes the **source of truth** for albums and covers. `localStorage` remains as a fallback / offline cache.

This is an **enabler sprint** for Sprint 76 (Library-Bindings Integration), because Sprint 76 requires server-side joins between `bindings` and `albums`.

---

## Topics

### 1. Server: Album Database & Repository

- New SQLite table `albums`:
  - `id TEXT PRIMARY KEY`
  - `title TEXT NOT NULL`
  - `artist TEXT NOT NULL`
  - `year TEXT`
  - `category TEXT` (nullable, RoleId)
  - `cover_url TEXT` (nullable, original MusicBrainz / CAA URL)
  - `cover_override TEXT` (nullable, JSON: `{type, source, blobUrl, fetchedAt}` or `{type, url, fetchedAt}`)
  - `role_history TEXT NOT NULL` (JSON array)
  - `listen_count INTEGER NOT NULL DEFAULT 0`
  - `last_listened TEXT` (nullable)
  - `story TEXT` (nullable, JSON: `{acquiredBecause, lifePhase, memoryNote, createdAt, updatedAt}`)
  - `created_at TEXT NOT NULL`
  - `updated_at TEXT NOT NULL`
- `createAlbumRepository(db)` with:
  - `findAll()`, `findById(id)`, `save(album)`, `delete(id)`, `exists(id)`
  - `findByArtist(artist)`, `findByTitle(title)` (for future search)
- Defensive normalization analogous to client-side `albumRepository.ts` (type guards, legacy-field cleanup)

### 2. Server: Album REST API

New router `/albums` (no write token for GET, write token required for mutations):

- `GET /albums` — list all albums
- `GET /albums/:id` — single album
- `POST /albums` — create album (body: `Album` without `id` → server generates UUID)
- `PUT /albums/:id` — update album (full replace)
- `DELETE /albums/:id` — delete album
- `POST /albums/import` — batch import (for migration from localStorage)
  - Body: `{ albums: Album[] }`
  - Upsert semantics (overwrites existing, creates missing)
  - Response: `{ imported: number, updated: number, failed: number }`

DTOs are 1:1 compatible with `src/types/album.ts` (camelCase in JSON).

### 3. Server: Cover Filesystem & API

- Storage location: `${ROTATION_DATA_DIR}/covers/`
- File structure: `<albumId>.<ext>` (e.g. `550e8400-e29b-41d4-a716-446655440000.jpg`)
- `createCoverService(dataDir)` with:
  - `saveCover(albumId, buffer, contentType)`
  - `getCoverPath(albumId)` → `string | null`
  - `deleteCover(albumId)`
  - `getContentType(albumId)` → from file extension or stored meta-JSON
- New router `/covers`:
  - `GET /covers/:albumId` — serve cover image (`Content-Type` from meta file)
  - `POST /covers/:albumId` — upload cover (multipart/form-data, write token required)
  - `DELETE /covers/:albumId` — delete cover (write token)
- Meta file per cover: `<albumId>.json` with `{ contentType, uploadedAt, source?: "upload" | "url" | "alternative" }`

### 4. Client: Album API Service

New file `src/services/api/albumsService.ts`:

- `fetchAlbums(): Promise<Album[]>`
- `fetchAlbum(id): Promise<Album>`
- `createAlbum(album): Promise<Album>`
- `updateAlbum(album): Promise<Album>`
- `deleteAlbum(id): Promise<void>`
- `importAlbums(albums): Promise<ImportResult>`

New file `src/services/api/coversService.ts`:

- `fetchCoverUrl(albumId): Promise<string>` → returns `/api/covers/:albumId`
- `uploadCover(albumId, file): Promise<void>`
- `deleteCover(albumId): Promise<void>`

### 5. Client: useLibrary Adaptation

`src/hooks/useLibrary.ts` is extended with server synchronization:

- **Initial Load:**
  1. Attempt: `fetchAlbums()` from server
  2. If server unreachable (ApiError status 0): fallback to `localStorage`
  3. If server reachable but empty (first installation): check `localStorage` for existing library → `importAlbums()` upload
- **Mutations:**
  - `addAlbum` → `createAlbum()` on server, then update local state
  - `updateAlbum` → `updateAlbum()` on server
  - `deleteAlbum` → `deleteAlbum()` on server + delete cover
  - `updateAlbumCoverOverride` → `uploadCover()` on server, then album update with new `coverOverride`
- **Optimistic Updates:** state is updated immediately, API call runs in background. On error: rollback.
- **Offline Fallback:** on network errors, mutation is buffered in `localStorage` and synced on next online event (optional: if time permits; otherwise read fallback is sufficient).

### 6. Client: Cover Cache Adaptation

`src/repositories/coverCache.ts` remains as a **client-side image cache**, but the **source** changes:

- `getCachedCover(albumId)` checks IndexedDB cache first
- If not present: `fetchCoverUrl(albumId)` from server, then cache in IndexedDB
- `cacheCover(albumId, sourceUrl)` remains for external URLs (MusicBrainz / CAA)
- `saveCustomCover` → calls `uploadCover()` on server instead, then caches locally
- `getCustomCover` → checks server cover via `GET /covers/:albumId`, caches locally

### 7. Migration & Backwards Compatibility

- **Automatic Migration:** on first server contact, `localStorage` library is uploaded
- **Schema Version:** client schema version is not incremented (data stays the same, only location changes)
- **Fallback:** if server is not running, the app continues to work with `localStorage`
- **Cover Migration:** existing custom covers from IndexedDB are migrated to server on first upload

---

## Architecture Changes

- **New Server Components:**
  - `server/src/infrastructure/persistence/sqlite/albumRepository.ts`
  - `server/src/application/coverService.ts`
  - `server/src/routes/albums.ts`
  - `server/src/routes/covers.ts`
- **Changed Server Components:**
  - `server/src/infrastructure/persistence/sqlite/connection.ts` — migration for `albums` table
  - `server/src/index.ts` — register routers, initialize services
- **New Client Components:**
  - `src/services/api/albumsService.ts`
  - `src/services/api/coversService.ts`
- **Changed Client Components:**
  - `src/hooks/useLibrary.ts` — server sync + fallback logic
  - `src/repositories/coverCache.ts` — server as source

---

## Affected Components

| Component | Change |
|---|---|
| `server/src/infrastructure/persistence/sqlite/connection.ts` | `albums` table in migration |
| `server/src/infrastructure/persistence/sqlite/albumRepository.ts` | **New** |
| `server/src/application/coverService.ts` | **New** |
| `server/src/routes/albums.ts` | **New** |
| `server/src/routes/covers.ts` | **New** |
| `server/src/index.ts` | Wire services & routers |
| `src/services/api/albumsService.ts` | **New** |
| `src/services/api/coversService.ts` | **New** |
| `src/hooks/useLibrary.ts` | Server sync instead of localStorage only |
| `src/repositories/coverCache.ts` | Server covers as source |
| `src/repositories/albumRepository.ts` | Kept for fallback / offline mode |

---

## Data Flow after Sprint 75.1

```
┌─────────────┐
│   Browser   │
│  (Client)   │
├─────────────┤
│ localStorage│ ← Fallback / offline cache
│  IndexedDB  │ ← Cover blob cache
└──────┬──────┘
       │ HTTP
┌──────┴──────┐
│   Caddy     │
│  (:3000)    │
└──────┬──────┘
       │
┌──────┴──────┐
│ rotation-api│
│  (:3001)    │
├─────────────┤
│ /albums     │ ← CRUD via SQLite
│ /covers     │ ← filesystem storage
│ /bindings   │ ← can now JOIN on albums
└─────────────┘
```

---

## Risks

| Risk | Mitigation |
|---|---|
| Data loss during migration | `importAlbums` is upsert — old data stays in localStorage as backup |
| Server unreachable → no data | Fallback to localStorage; mutations buffer or write directly to localStorage |
| Cover upload of large files | multipart upload with size limit (e.g. 5 MB); validation on server |
| Performance: covers from filesystem slow | `express.static` for `/covers` with Caddy cache headers; client IndexedDB as second cache layer |
| Concurrent updates | SQLite WAL mode is active; PUT on album is full replace (last-write-wins) |

---

## Definition of Done

- [x] `albums` table exists in SQLite with correct schema
- [x] `GET /albums`, `GET /albums/:id`, `POST /albums`, `PUT /albums/:id`, `DELETE /albums/:id` are implemented and tested
- [x] `POST /albums/import` migrates existing localStorage library to server
- [x] Covers are stored as files in `${ROTATION_DATA_DIR}/covers/`
- [x] `GET /covers/:albumId`, `POST /covers/:albumId`, `DELETE /covers/:albumId` work
- [x] `useLibrary` loads albums from server; localStorage is fallback
- [x] `coverCache` reads covers from server and caches them locally in IndexedDB
- [x] No regression: all existing client features work with and without server
- [x] New API routes are correctly proxied in the Caddyfile
- [x] `SELFHOST.md` updated with note on cover storage directory

---

## Enabler for Sprint 76

After completing 75.1, Sprint 76 can directly access the server-side album table:

- `bindingRepository.ts` gets `findOrphans()` — bindings without matching `albums` entry
- `BindingDTO` gets `libraryExists: boolean`, `albumTitle`, `albumArtist` via JOIN
- `GET /bindings/orphans` delivers orphaned bindings
- No client-side matching needed anymore — everything happens in SQLite
