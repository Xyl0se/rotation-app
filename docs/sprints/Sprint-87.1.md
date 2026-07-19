# Sprint 87.1 — Acquisition Context in Album History

**Status:** Planned

**Target version:** Future focused follow-up

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

- Client and server contract tests accept and round-trip both values.
- Capture and Edit Album tests expose both localized choices and save them correctly.
- Timeline, Library search, Insights, and Rotation explanation tests render or group
  the new values without falling back to “Other”.
- Existing acquisition reasons and Albums without an answer remain unchanged.
- DE/EN copy distinguishes acquisition motive from current Album Role.

## Definition of Done

- [ ] Completion and Collection essential can be selected during Capture and editing.
- [ ] Both reasons survive reload, backup/restore, and API round trips.
- [ ] Album history presents the selected reason in German and English.
- [ ] Neither reason changes or implies an Album Role automatically.
- [ ] Search, timeline, Insights, and explanations handle both values deterministically.
- [ ] Automated tests and NAS acceptance cover creation, editing, and persistence.

## Non-goals

- Tracking ownership at individual-track level
- Modelling edition upgrades or replacing one edition with another
- Importing “essential Albums” lists or popularity rankings
- Automatically assigning Classic, Admire, or Archive Roles from acquisition context
