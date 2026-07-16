# Sprint 80 — NAS Acceptance Test

**Status:** Passed on production NAS — 2026-07-16

**Purpose:** Verify that Rotation, Focus Album, and listening history are genuinely
server-owned after deployment. This is a focused state-ownership test; it does not
introduce cross-browser synchronization as a separate feature.

## Preconditions

- Deploy a build containing Sprint 80 and database migration 5. The subsequently
  corrected Classic eligibility is delivered by migration 6.
- Keep the API volume and SQLite database mounted persistently.
- Open the application in two independent browser contexts, for example a normal
  window and a private window or a second browser.
- Do not clear production browser storage until the migration result is confirmed.

## A — Legacy Import, if offered

- [x] Browser A shows the migration banner only when valid legacy Rotation or listening
  data exists.
- [x] The preview counts are plausible.
- [x] Trigger the import once and verify that Rotation, Focus, and listening history
  appear afterward.
- [x] Reload Browser A. The imported state remains present and the migration banner is
  gone.
- [x] If legacy data existed, record whether a second import attempt produces no
  duplication.

If no legacy banner appears because the browser no longer contains legacy data, mark
this section `not applicable`; the idempotent import path is covered automatically.

## B — Canonical Rotation and Focus

- [x] In Browser A, create and accept a Rotation.
- [x] Select a random Focus Album with the dice button.
- [x] Confirm that the selected Focus belongs to the visible active Rotation.
- [x] Reload Browser A. Rotation and Focus remain unchanged.
- [x] Open Browser B. It shows the same active Rotation and Focus without manual import.
- [x] Change the Focus in Browser B, then reload Browser A. Browser A shows the confirmed
  server value.

## C — Listening History

- [x] Record one listening session for an Album in Browser A.
- [x] Reload Browser A and verify the updated listening count/timestamp.
- [x] Reload Browser B and verify the same listening state.
- [x] Confirm that no duplicate event appears after a normal reload or retry.

## D — Role and Referential-Integrity Guard

- [x] Assign or reassess an active Rotation Album as `Classic`, `Admired`, or `Archive`.
- [x] Reload both browsers.
- [x] The Album is absent from the active Rotation in both browsers.
- [x] If it had been Focus, the Focus position is empty and offers the dice placeholder.

## E — Production Backup/Restore

- [x] Create a database backup after sections B and C.
- [x] Record the active Rotation ID/name, Focus Album, and one listening count.
- [x] Make a recognizable temporary state change.
- [x] Stop the stack and restore the selected backup using the documented operational
  procedure.
- [x] Start the stack and verify database health.
- [x] Rotation, Focus, and listening state match the recorded pre-change values in both
  browsers.

## Acceptance

All sections passed on the production NAS. Rotation, Focus Album, listening history,
role cleanup, legacy import, second-browser visibility, and backup/restore behaved as
specified. Sprint 80 is accepted.
