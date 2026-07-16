# Sprint 80 — NAS Acceptance Test

**Status:** Pending production execution

**Purpose:** Verify that Rotation, Focus Album, and listening history are genuinely
server-owned after deployment. This is a focused state-ownership test; it does not
introduce cross-browser synchronization as a separate feature.

## Preconditions

- Deploy a build containing Sprint 80 and database migration 5.
- Keep the API volume and SQLite database mounted persistently.
- Open the application in two independent browser contexts, for example a normal
  window and a private window or a second browser.
- Do not clear production browser storage until the migration result is confirmed.

## A — Legacy Import, if offered

- [ ] Browser A shows the migration banner only when valid legacy Rotation or listening
  data exists.
- [ ] The preview counts are plausible.
- [ ] Trigger the import once and verify that Rotation, Focus, and listening history
  appear afterward.
- [ ] Reload Browser A. The imported state remains present and the migration banner is
  gone.
- [ ] If legacy data existed, record whether a second import attempt produces no
  duplication.

If no legacy banner appears because the browser no longer contains legacy data, mark
this section `not applicable`; the idempotent import path is covered automatically.

## B — Canonical Rotation and Focus

- [ ] In Browser A, create and accept a Rotation.
- [ ] Select a random Focus Album with the dice button.
- [ ] Confirm that the selected Focus belongs to the visible active Rotation.
- [ ] Reload Browser A. Rotation and Focus remain unchanged.
- [ ] Open Browser B. It shows the same active Rotation and Focus without manual import.
- [ ] Change the Focus in Browser B, then reload Browser A. Browser A shows the confirmed
  server value.

## C — Listening History

- [ ] Record one listening session for an Album in Browser A.
- [ ] Reload Browser A and verify the updated listening count/timestamp.
- [ ] Reload Browser B and verify the same listening state.
- [ ] Confirm that no duplicate event appears after a normal reload or retry.

## D — Role and Referential-Integrity Guard

- [ ] Assign or reassess an active Rotation Album as `Classic`, `Admired`, or `Archive`.
- [ ] Reload both browsers.
- [ ] The Album is absent from the active Rotation in both browsers.
- [ ] If it had been Focus, the Focus position is empty and offers the dice placeholder.

## E — Production Backup/Restore

- [ ] Create a database backup after sections B and C.
- [ ] Record the active Rotation ID/name, Focus Album, and one listening count.
- [ ] Make a recognizable temporary state change.
- [ ] Stop the stack and restore the selected backup using the documented operational
  procedure.
- [ ] Start the stack and verify database health.
- [ ] Rotation, Focus, and listening state match the recorded pre-change values in both
  browsers.

## Acceptance

Sprint 80 can move to `done` when sections B–E pass and section A either passes or is
explicitly marked not applicable. On failure, record the browser, action, visible
error, HTTP status/response body, and the matching API log timestamp.
