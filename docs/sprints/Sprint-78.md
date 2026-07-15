# Sprint 78 — Library Findability

**Status:** Planned — first product sprint after Sprint 77

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
- Offer listening-state filters such as “never listened” without inventing scores.
- Make search, filters, and existing Library views compose predictably.
- Provide an obvious reset and a useful empty state.

## Workstream 78C — Transparent Saved Views

- Add only a small set of deterministic views backed by existing fields, such as
  “Never listened” and “Recently archived”.
- Explain the rule for every view in plain language.
- Avoid opaque recommendations, role targets, or collection grading.

## Definition of Done

- [ ] Title, artist, and story search works with keyboard and pointer input.
- [ ] Search and filters work across all existing Library perspectives.
- [ ] Filters use canonical server data and create no browser-owned Library copy.
- [ ] Saved views are deterministic and their rules are visible.
- [ ] Accessibility, empty-state, and regression tests cover the primary paths.
- [ ] Performance is measured with a representative library fixture.

## Non-Goals

- Replacing existing Library perspectives
- Full-text database infrastructure without measured need
- Recommendation scores or “collection health”
- Binding-folder search
