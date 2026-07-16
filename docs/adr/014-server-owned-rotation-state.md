# ADR 014 — Server-Owned Rotation, Focus, and Listening State

**Status:** Accepted

**Date:** 2026-07-16

## Decision

SQLite is the canonical owner of Listening Events, draft/active Rotation Plans,
Rotation composition, and the Focus Album. Browser storage is not a runtime domain store.

The Focus Album belongs to the active Rotation. It may be null, but if present it
must reference an Album contained in that Rotation. Removing the focused item clears
the Focus atomically. Random Focus selection operates exclusively on active items.

Album deletion cascades Listening Events and Rotation items. If this empties or
changes the active Rotation, its Focus invariant is restored in the same transaction.
Archive does not delete historical events and does not implicitly remove an Album.

## Conflict Semantics

This is a single-user self-hosted application. Mutations use complete server-confirmed
representations and stable IDs. There is no offline mutation queue or automatic merge.
A stale client reloads canonical state and retries deliberately.

## Historical Legacy Import

Sprint 80 initially provided an idempotent bridge from legacy browser keys. Sprint 82E
removed that bridge after production acceptance confirmed the migration. No legacy
import path remains in the runtime application.

## Consequences

- Backup/restore now covers the complete intended workflow.
- Reloads and other browsers see the same Rotation, Focus, and Listening History.
- Rotation composition Settings must use the server contract.
- The 25-Album `10/5/5/5` composition is the initial server default, not a fixed
  invariant. A later Settings contract may change the total maximum and eligible-role
  quotas, while existing Rotation Plans retain the composition snapshot with which
  they were created.
- Local-storage domain repositories and their migration bridge have been removed.
