# Sprint 76 — Library-Bindings Integration

**Status:** Backlog — starts after Sprint 75.

**Target version:** `v0.26.0-dev`

---

## Goal

Bindings and Library become visibly connected. A binding is no longer an isolated file-system mapping — its relationship to the Library is transparent in both directions.

## Topics

### Bidirectional Visibility

- **Library → Binding:** Album cards in the Library show whether the album has a confirmed binding (e.g. a small linked-folder indicator).
- **Binding → Library:** Each binding row shows whether the referenced album exists in the Library (title/artist preview or an "orphan" badge).

### Album Coach Orphan Prompt

- When a scan confirms (or proposes) a binding whose `albumId` is not present in the Library, the Album Coach invites the user to capture the album.
- This bridges the gap between "I have the files" and "I have the story".

## Architecture Changes

- Extended `BindingDTO` with `libraryExists: boolean` and optional `albumTitle` / `albumArtist`.
- New endpoint: `GET /bindings/orphans` — bindings without matching Library albums.
- Frontend: `BindingsPage` fetches correlated Library data; `Library` fetches binding summary.

## Affected Components

- `server/src/routes/bindings.ts` — new fields in DTO, orphan endpoint
- `server/src/infrastructure/persistence/sqlite/bindingRepository.ts` — join or lookup against albums table
- `src/services/api/bindingsService.ts` — updated types and new API methods
- `src/pages/BindingsPage.tsx` — orphan badge, album metadata preview
- `src/components/features/library/Library.tsx` / `AlbumCard.tsx` — binding-linked indicator
- `src/components/features/album-coach/` — orphan invitation flow
- `src/i18n/locales/{en,de}.ts` — new keys for badges, tooltips, and Coach prompt

## Risks

- Performance: joining bindings with albums on every scan/load; needs indexing or caching strategy.
- UX ambiguity: an orphan binding might be intentional (album not yet catalogued); the prompt must be dismissible and not intrusive.

## Definition of Done

- [ ] Library shows a visual indicator when an album has a confirmed binding
- [ ] Bindings list shows a clear "not in Library" / orphan state for missing albums
- [ ] When a scan produces a confirmed binding without a Library entry, the Album Coach offers to start discovery
- [ ] Album Coach orphan prompt is dismissible and non-intrusive
- [ ] All new UI strings are internationalized (EN/DE)
- [ ] No regression in scan or export performance
