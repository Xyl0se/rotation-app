# Sprint 80 — Canonical Listening & Rotation Persistence

**Status:** Completed — production NAS acceptance passed 2026-07-16

**Target version:** `v0.28.0-dev`

**Type:** Data ownership migration

---

## Goal

Move Listening History, Focus Album, and RotationPlan from browser-local canonical
state to explicit server ownership, with safe one-time import of existing browser
data. This closes the remaining backup gap before any multi-device or PWA work.

This sprint is about durability and a single coherent source of truth. It does not
promise offline editing or general-purpose synchronization.

The Focus Album is part of the active Rotation, not an independent Library choice.
The server must reject every Focus assignment whose Album is not contained in the
active Rotation. Random Focus selection is therefore also a server operation over
the active Rotation only.

## Workstream 80A — Contract and Schema

- [x] Write an ADR for server ownership, referential integrity, deletion behavior, and
  conflict semantics.
- [x] Add SQLite migrations and repositories for listening events, Focus Album, draft
  rotation, and active rotation.
- [x] Define initial APIs with stable identifiers and idempotent mutation behavior.
- [x] Include the new data in backup/restore verification.
- [x] Persist Rotation composition settings with the Rotation so the future Settings UI
  can adjust role quotas without introducing another browser-owned source of truth.

Initial implementation provides schema migration 4, transactional Rotation/Focus
storage, idempotent Listening Event storage, canonical state reads, Focus assignment,
server-side random Focus, and an idempotent legacy-import endpoint. Client migration
and server-authoritative hooks remain the next implementation step.

## Workstream 80B — Legacy Browser Import

- [x] Detect valid browser-local history and rotation data without treating it as a cache.
- [x] Preview counts and require a deliberate migration action.
- [x] Make import idempotent and preserve timestamps and event identities.
- [x] Delete legacy canonical keys only after server confirmation; retain recovery guidance
  for partial failures.

## Workstream 80C — Server-Authoritative UI

- [x] Load listening, Focus Album, and rotation state from the API.
- [x] Apply confirmed-mutation semantics consistent with the server Library.
- [x] Define clear unavailable/retry states; do not add an offline mutation queue.
- [x] Verify behavior in a second browser as a consequence of server ownership, not as a
  separate synchronization engine.

Home and Export now read the same canonical server Rotation. Focus selection is no
longer offered from arbitrary Library cards; the Focus card asks the server for a
random Album from the active Rotation. Listening Event creation updates the Album's
derived count and timestamp in the same transaction.

## Definition of Done

- [x] ADR, schema, repositories, and API contracts define one canonical owner.
- [x] Existing valid browser data can be imported once without loss or duplication.
- [x] Reload and a second browser show the same confirmed listening/rotation state.
- [x] Album deletion and archival behavior preserve referential integrity.
- [x] Backup/restore covers all newly server-owned data.
- [x] Obsolete canonical local-storage keys are removed only after safe migration.
- [x] Route-level integration and UI regression tests cover failure and retry paths.

Automated verification now covers authenticated mutations, validation, canonical
reloads, Focus membership, random Focus selection, idempotent Listening Events,
legacy-import conflicts, confirmed-state UI behavior, explicit retry, and a real
SQLite backup/restore containing Rotation, Focus, and Listening Events. The remaining
deployed two-browser and backup/restore gate passed as recorded in the archived
[`SPRINT-80-NAS-ACCEPTANCE-TEST.md`](../../archive/acceptance-tests/SPRINT-80-NAS-ACCEPTANCE-TEST.md).

## Non-Goals

- Offline-first writes or background conflict resolution
- User accounts or multi-user editing
- Native applications
- Device-specific preference synchronization
- Product-shell redesign, logo, Settings visuals, and general UI polish (Sprint 81)
