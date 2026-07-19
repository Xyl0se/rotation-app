# Sprint 87.1 — Acquisition Context in Album History

**Status:** Done ✅ — integrated as a backward-compatible Album Story extension

**Target version:** v0.30.0

**Type:** Personal Album history and structured acquisition context

## Goal

Extend the structured question “Why did you acquire this Album?” with two collection
motives that are not represented accurately by the existing choices:

- **Completion** (`completion`) — the user already owned or knew individual tracks, a
  partial release, or an incomplete edition and acquired the complete Album or a more
  complete edition.
- **Collection essential** (`collection-essential`) — the Album was acquired because it
  is regarded as canonical or as something that “belongs in every collection”, even
  when a strong personal relationship had not yet formed.

These motives remain distinct. Completion describes filling a concrete gap; collection
essential describes an expectation about the collection. Neither reason implies that
the Album is already a personal Classic or that it has been heard frequently.

## Scope

- Add both values to the shared client/server `AlbumAcquisitionReason` contract.
- Present localized labels in Album Capture, Album editing, Album Detail/history, and
  every other surface that renders the structured acquisition reason.
- Use **„Komplettierung“** and **„Gehört in die Sammlung“** in German; use
  **“Completion”** and **“Collection essential”** in English.
- Preserve both values through API validation, SQLite serialization, backup/restore,
  search, timeline entries, Insights, and Rotation explanations.
- Treat the values as user-provided personal history. Rotation must not infer either
  motive from track counts, edition metadata, ratings, popularity, or external lists.
- Keep existing Album Story values backward compatible; no existing record requires a
  data migration.

## Product behavior

- Selecting Completion records why the complete Album or edition was acquired; it does
  not attempt to model which tracks or earlier edition were previously owned.
- Selecting Collection essential records an acquisition motive, not an endorsement.
  Role assignment continues to express the user's current personal relationship.
- Both reasons may participate in the existing deterministic acquisition-thread
  Insight, subject to its normal evidence and privacy thresholds.
- Free-text memories remain optional and are never derived from these values.

## Verification

- The existing client and server validation suite passes with both values in the shared
  contracts and API schema.
- Capture, editing, Album history, Library search, and deterministic Insights consume
  the same typed values without falling back to “Other”.
- SQLite stores Album Story as backward-compatible JSON, so reload, backup, restore,
  and API round trips require no schema migration.
- Rotation explainability contains no automatic role inference for either value.
- DE/EN copy distinguishes acquisition motive from current Album Role.
- As explicitly agreed for this small additive change, no separate NAS acceptance run
  or dedicated acceptance document is required.

## Definition of Done

- [x] Completion and Collection essential can be selected during Capture and editing.
- [x] Both reasons survive reload, backup/restore, and API round trips.
- [x] Album history presents the selected reason in German and English.
- [x] Neither reason changes or implies an Album Role automatically.
- [x] Search, timeline, Insights, and explanations handle both values deterministically.
- [x] The complete existing validation suite passes; no separate NAS acceptance is required.

## Non-goals

- Tracking ownership at individual-track level
- Modelling edition upgrades or replacing one edition with another
- Importing “essential Albums” lists or popularity rankings
- Automatically assigning Classic, Admire, or Archive Roles from acquisition context
