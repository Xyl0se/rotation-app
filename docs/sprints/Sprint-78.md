# Sprint 78 — Library Findability

**Status:** Implementation complete; production UX verification pending

**Target version:** `v0.27.0-dev`

**Type:** Product usability

---

## Goal

Make an album easy to find as the server-backed Library grows, without turning
Rotation into a collection-management or analytics tool.

Existing perspectives by artist, year, last listening session, and role change are
retained. This sprint adds retrieval and narrowing, not duplicate groupings.

## Workstream 78A — Search

- Add one clearly visible Library search field.
- Search title, artist, and Album Story with normalized, case-insensitive matching.
- Keep search as a client-side projection of the confirmed server Library initially;
  introduce a server query only if measured library size requires it.
- Provide a keyboard shortcut that focuses search without interfering with dialogs
  or text inputs.

## Workstream 78B — Composable Filters

- Filter by album role, archive state, and release year/range.
- Include an explicit “No role assigned” filter for albums that still need the
  Album Coach; do not silently fold them into another role.
- Offer listening-state filters such as “never listened” without inventing scores.
- Make search, filters, and existing Library views compose predictably.
- Provide an obvious reset and a useful empty state.

## Workstream 78C — Transparent Saved Views

- Add only a small set of deterministic views backed by existing fields, such as
  “Never listened” and “Recently archived”.
- Explain the rule for every view in plain language.
- Avoid opaque recommendations, role targets, or collection grading.

## Architecture

- Search and filters are a pure client-side projection of the confirmed API Library.
- One `filterLibraryAlbums` pipeline feeds All, Roles, and every Perspective; views
  do not implement their own divergent filtering rules.
- Filter state lives only in React memory and resets on reload as intended.
- Search normalizes case, diacritics, and whitespace. Year bounds are inclusive.
- “Recently archived” means an album currently in Archive with an Archive role-history
  entry no more than 30 days old.

## Definition of Done

- [x] Title, artist, and story search works with keyboard and pointer input.
- [x] Search and filters work across all existing Library perspectives.
- [x] Albums without a role can be isolated with a dedicated filter.
- [x] Filters use canonical server data and create no browser-owned Library copy.
- [x] Saved views are deterministic and their rules are visible.
- [x] Accessibility, empty-state, and regression tests cover the primary paths.
- [x] Performance is measured with a representative 10,000-album fixture.

## Verification

- Domain tests cover normalization, composition, roleless albums, listen-event
  reconciliation, recent Archive semantics, and 10,000-album performance.
- UI tests cover German labels, Story search, `/` focus, reset, empty state,
  quick-view toggling, and persistence of the filtered projection across Perspectives.
- Full frontend/server validation and production builds remain required before merge.

## Non-Goals

- Replacing existing Library perspectives
- Full-text database infrastructure without measured need
- Recommendation scores or “collection health”
- Binding-folder search
