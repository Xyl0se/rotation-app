# Sprint 80 — Canonical Listening & Rotation Persistence

**Status:** Planned — architectural prerequisite, not required for the first release

**Target version:** `v0.28.0-dev`

**Type:** Data ownership migration

---

## Goal

Move Listening History, Focus Album, and RotationPlan from browser-local canonical
state to explicit server ownership, with safe one-time import of existing browser
data. This closes the remaining backup gap before any multi-device or PWA work.

This sprint is about durability and a single coherent source of truth. It does not
promise offline editing or general-purpose synchronization.

## Workstream 80A — Contract and Schema

- Write an ADR for server ownership, referential integrity, deletion behavior, and
  conflict semantics.
- Add SQLite migrations and repositories for listening events, Focus Album, draft
  rotation, and active rotation.
- Define APIs with stable identifiers and idempotent mutation behavior.
- Include the new data in backup/restore verification.

## Workstream 80B — Legacy Browser Import

- Detect valid browser-local history and rotation data without treating it as a cache.
- Preview what will be imported and require a deliberate migration action.
- Make import idempotent and preserve timestamps and event identities.
- Delete legacy canonical keys only after server confirmation; retain recovery guidance
  for partial failures.

## Workstream 80C — Server-Authoritative UI

- Load listening, Focus Album, and rotation state from the API.
- Apply confirmed-mutation semantics consistent with the server Library.
- Define clear unavailable/retry states; do not add an offline mutation queue.
- Verify behavior in a second browser as a consequence of server ownership, not as a
  separate synchronization engine.

## Definition of Done

- [ ] ADR, schema, repositories, and API contracts define one canonical owner.
- [ ] Existing valid browser data can be imported once without loss or duplication.
- [ ] Reload and a second browser show the same confirmed listening/rotation state.
- [ ] Album deletion and archival behavior preserve referential integrity.
- [ ] Backup/restore covers all newly server-owned data.
- [ ] Obsolete canonical local-storage keys are removed only after safe migration.
- [ ] Route-level integration and UI regression tests cover failure and retry paths.

## Non-Goals

- Offline-first writes or background conflict resolution
- User accounts or multi-user editing
- Native applications
- Device-specific preference synchronization
